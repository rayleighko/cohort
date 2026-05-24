import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MacroComposite } from '@/lib/macro/composite';

vi.mock('@/lib/claude/client', () => ({
  callPersonaMultiTurn: vi.fn(),
  getAnthropicClient: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
  COHORT_PERSONA_MODEL: 'claude-sonnet-4-6',
  COHORT_CLASSIFIER_MODEL: 'claude-haiku-4-5-20251001',
}));

vi.mock('@/lib/claude/safety-filter', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/claude/safety-filter')
  >('@/lib/claude/safety-filter');
  return {
    ...actual,
    applySafetyFilter: vi.fn(),
  };
});

vi.mock('@/lib/analytics/posthog-server', () => ({
  getServerPostHog: vi.fn(() => null),
}));

// Mutable admin mocks — each test resets the history fetch + insert behavior.
const mockedHistorySelect = vi.fn();
const mockedInsert = vi.fn(async () => ({ error: null as Error | null }));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: mockedHistorySelect,
          })),
        })),
      })),
      insert: mockedInsert,
    })),
  })),
}));

import { POST } from '../route';
import { callPersonaMultiTurn } from '@/lib/claude/client';
import { applySafetyFilter } from '@/lib/claude/safety-filter';

const mockedCallPersonaMultiTurn = vi.mocked(callPersonaMultiTurn);
const mockedApplySafetyFilter = vi.mocked(applySafetyFilter);

const SAMPLE_COMPOSITE: MacroComposite = {
  score: 2.34,
  zone: 'neutral-dovish',
  keyDriver: { source: 'fred', code: 'KR_US_RATE_SPREAD', contribution: 1.42 },
  indicators: [
    {
      source: 'fred',
      code: 'KR_US_RATE_SPREAD',
      latest: 1.05,
      normalized: 1.6,
      weight: 0.25,
      contribution: 0.4,
    },
  ],
  computedAt: '2026-05-24T01:00:00.000Z',
  asOfDate: '2026-05-23',
};

const ALLOW_FILTER = {
  decision: 'ALLOW' as const,
  category: 'INFORMATIONAL' as const,
  layer1: 'CLEAR_PASS' as const,
  layer2: null,
  redirectText: null,
};

const BLOCK_FILTER = {
  decision: 'BLOCK' as const,
  category: 'ADVISORY_REQUEST' as const,
  layer1: 'CLEAR_BLOCK' as const,
  layer2: null,
  redirectText: 'Cohort는 추천·권장은 제공하지 않아요',
};

const VALID_SESSION = '00000000-0000-4000-8000-000000000001';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/aurora/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  // Default: no prior history. Tests that need prior turns override before POST.
  mockedHistorySelect.mockResolvedValue({ data: [], error: null });
  mockedInsert.mockImplementation(async () => ({ error: null }));
});

afterEach(() => {
  vi.restoreAllMocks();
  mockedCallPersonaMultiTurn.mockReset();
  mockedApplySafetyFilter.mockReset();
  mockedHistorySelect.mockReset();
  mockedInsert.mockReset();
});

describe('POST /api/aurora/chat — input validation', () => {
  it('returns 400 invalid_body on non-JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/aurora/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not json',
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_body');
  });

  it('returns 400 invalid_session_id when sessionId is missing', async () => {
    const res = await POST(
      makeRequest({ message: '안녕' }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_session_id');
  });

  it('returns 400 invalid_session_id when sessionId is not UUID-shaped', async () => {
    const res = await POST(
      makeRequest({ sessionId: 'not-a-uuid', message: '안녕' }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_session_id');
  });

  it('returns 400 invalid_message when message is empty/whitespace', async () => {
    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '   ' }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_message');
  });

  it('returns 400 invalid_message when message exceeds 2000 char cap', async () => {
    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: 'a'.repeat(2001),
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_message');
  });

  it('returns 400 invalid_composite when composite is malformed', async () => {
    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '안녕',
        composite: { score: 'not a number' },
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_composite');
  });
});

describe('POST /api/aurora/chat — input-side safety filter (short-circuit before Claude)', () => {
  it('returns 200 + redirect + triggered=true when input filter BLOCKs, NEVER calls Claude', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(BLOCK_FILTER);

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '지금 KOSPI 매수해야 할까요?',
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.character).toBe('aurora');
    expect(body.triggered).toBe(true);
    expect(body.text).toContain('Cohort는');
    expect(body.sessionId).toBe(VALID_SESSION);
    expect(body.turnIndex).toBe(1);

    // Claude must not be invoked on advisory input (Day 11 cost + safety primacy).
    expect(mockedCallPersonaMultiTurn).not.toHaveBeenCalled();

    // 2-row persistence (user + assistant redirect).
    expect(mockedInsert).toHaveBeenCalledOnce();
    const insertedRows = (mockedInsert.mock.calls as unknown as Array<Array<unknown>>)[0][0] as Array<{
      role: string;
      turn_index: number;
      safety_filter_triggered: boolean;
      safety_filter_category: string | null;
    }>;
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0].role).toBe('user');
    expect(insertedRows[0].turn_index).toBe(0);
    expect(insertedRows[0].safety_filter_triggered).toBe(false);
    expect(insertedRows[1].role).toBe('assistant');
    expect(insertedRows[1].turn_index).toBe(1);
    expect(insertedRows[1].safety_filter_triggered).toBe(true);
    expect(insertedRows[1].safety_filter_category).toBe('ADVISORY_REQUEST');
  });
});

describe('POST /api/aurora/chat — Claude success path', () => {
  it('returns 200 + narration + triggered=false on full safe path', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER) // input filter
      .mockResolvedValueOnce(ALLOW_FILTER); // output filter
    mockedCallPersonaMultiTurn.mockResolvedValueOnce(
      '한미 금리차는 capital flow 입력 변수예요. 본인 plan 영역 그대로 점검해보세요.',
    );

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '한미 금리차가 좁혀지면 KOSPI에 어떻게 작용해요?',
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.character).toBe('aurora');
    expect(body.triggered).toBe(false);
    expect(body.text).toContain('한미 금리차');
    expect(body.turnIndex).toBe(1);

    expect(mockedCallPersonaMultiTurn).toHaveBeenCalledOnce();
    const [character, system, messages] =
      mockedCallPersonaMultiTurn.mock.calls[0];
    expect(character).toBe('aurora');
    expect(system).toContain('Aurora');
    expect(messages[messages.length - 1].role).toBe('user');
    expect(messages[messages.length - 1].content).toContain('한미 금리차');

    // 2-row persistence — user + assistant.
    const insertedRows = (mockedInsert.mock.calls as unknown as Array<Array<unknown>>)[0][0] as Array<{
      role: string;
      safety_filter_triggered: boolean;
    }>;
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0].role).toBe('user');
    expect(insertedRows[1].role).toBe('assistant');
    expect(insertedRows[1].safety_filter_triggered).toBe(false);
  });

  it('redirects when assistant output trips containsForbiddenOutput (deterministic guard)', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER); // input passes
    mockedCallPersonaMultiTurn.mockResolvedValueOnce(
      '오늘 cohort. 비중 30%로 늘리세요.',
    );

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: 'KOSPI 어때요?',
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triggered).toBe(true);
    expect(body.text).toContain('본인 plan');

    // Output filter must NOT be called once containsForbiddenOutput fires.
    expect(mockedApplySafetyFilter).toHaveBeenCalledOnce(); // input only

    const insertedRows = (mockedInsert.mock.calls as unknown as Array<Array<unknown>>)[0][0] as Array<{
      role: string;
      safety_filter_triggered: boolean;
      safety_filter_category: string | null;
    }>;
    expect(insertedRows[1].safety_filter_triggered).toBe(true);
    expect(insertedRows[1].safety_filter_category).toBe('FORBIDDEN_OUTPUT');
  });

  it('redirects when assistant output trips applySafetyFilter (defense-in-depth)', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER) // input passes
      .mockResolvedValueOnce(BLOCK_FILTER); // output catches soft phrasing
    mockedCallPersonaMultiTurn.mockResolvedValueOnce(
      // Plausible Aurora-styled prose that the deterministic guard misses
      // but Layer 2 Haiku classifier would flag as ADVISORY_REQUEST.
      '오늘 매크로 흐름을 보면 본인 plan 페이스 좀 빠르게 가져가시는 것도 괜찮을 수 있어요.',
    );

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '본인 plan 페이스 적절한가요?',
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triggered).toBe(true);
    expect(body.text).toContain('Cohort는');
    expect(mockedApplySafetyFilter).toHaveBeenCalledTimes(2);
  });

  it('returns 503 + Korean fallback when callPersonaMultiTurn throws (no persistence on 503)', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockRejectedValueOnce(new Error('Anthropic 429'));

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '안녕',
      }) as never,
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('chat_unavailable');
    expect(body.text).toContain('Aurora가 잠시 자리를 비웠습니다');
    expect(mockedInsert).not.toHaveBeenCalled();
  });
});

describe('POST /api/aurora/chat — multi-turn history context', () => {
  it('fetches last-20 history and passes to prompt builder; next turn_index = last + 1', async () => {
    // Mock prior 4 turns (turn_index 0..3). Last turn = 3 → next user = 4, asst = 5.
    mockedHistorySelect.mockResolvedValue({
      data: [
        { turn_index: 3, role: 'assistant', text: 'prior a' },
        { turn_index: 2, role: 'user', text: 'prior q' },
        { turn_index: 1, role: 'assistant', text: 'older a' },
        { turn_index: 0, role: 'user', text: 'older q' },
      ],
      error: null,
    });
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('continuation 응답');

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '추가 질문이에요',
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.turnIndex).toBe(5);

    // Prompt builder received history in chronological (asc) order.
    const [, , messages] = mockedCallPersonaMultiTurn.mock.calls[0];
    expect(messages.map((m) => m.content.slice(0, 50))).toEqual([
      'older q',
      'older a',
      'prior q',
      'prior a',
      '추가 질문이에요',
    ]);

    // Persistence uses turn_index 4 + 5.
    const insertedRows = (mockedInsert.mock.calls as unknown as Array<Array<unknown>>)[0][0] as Array<{
      turn_index: number;
    }>;
    expect(insertedRows[0].turn_index).toBe(4);
    expect(insertedRows[1].turn_index).toBe(5);
  });

  it('returns 503 when history fetch errors (never inserts at a guessed turn_index)', async () => {
    mockedHistorySelect.mockResolvedValue({
      data: null,
      error: new Error('rls denied'),
    });
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '처음 질문',
      }) as never,
    );

    // History fetch error → 503 (instead of writing at turn_index 0 over
    // existing rows). Paired with the UNIQUE(session_id, turn_index) index
    // in migration 0005, this turns silent data corruption into a loud retry.
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('chat_unavailable');
    expect(mockedCallPersonaMultiTurn).not.toHaveBeenCalled();
    expect(mockedInsert).not.toHaveBeenCalled();
  });
});

describe('POST /api/aurora/chat — composite context (optional)', () => {
  it('inlines composite into the new user message when provided', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('응답');

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '오늘 매크로 어때요?',
        composite: SAMPLE_COMPOSITE,
      }) as never,
    );

    expect(res.status).toBe(200);
    const [, , messages] = mockedCallPersonaMultiTurn.mock.calls[0];
    const newTurn = messages[messages.length - 1];
    expect(newTurn.content).toContain('macro composite');
    expect(newTurn.content).toContain('neutral-dovish');
    expect(newTurn.content).toContain('오늘 매크로 어때요?');
  });
});
