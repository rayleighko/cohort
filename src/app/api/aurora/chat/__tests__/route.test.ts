import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MacroComposite } from '@/lib/macro/composite';

vi.mock('@/lib/claude/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/claude/client')>();
  return {
    ...actual,
    // Mock only the network-hitting + Anthropic-client surfaces; keep
    // shouldUseSonnet + model constants live so per-turn routing is
    // exercised end-to-end in tests.
    callPersonaMultiTurn: vi.fn(),
    getAnthropicClient: vi.fn(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

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

// Mutable admin mocks — table-aware dispatcher (aurora_chat history+insert
// vs chat_quota_usage select+insert+update — different chained calls).
const mockedHistorySelect = vi.fn();
const mockedInsert = vi.fn(async () => ({ error: null as Error | null }));
const mockedQuotaFetch = vi.fn(async () => ({
  data: null as
    | { id: string; message_count: number; haiku_count: number; sonnet_count: number }
    | null,
  error: null as Error | null,
}));
const mockedQuotaInsert = vi.fn(async () => ({ error: null as Error | null }));
const mockedQuotaUpdate = vi.fn(async () => ({ error: null as Error | null }));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'chat_quota_usage') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mockedQuotaFetch,
              })),
            })),
          })),
          insert: mockedQuotaInsert,
          update: vi.fn(() => ({
            eq: mockedQuotaUpdate,
          })),
        };
      }
      // Default: aurora_chat (history fetch + turn pair persistence)
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: mockedHistorySelect,
            })),
          })),
        })),
        insert: mockedInsert,
      };
    }),
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
  // Default: no prior history + no prior quota usage. Tests that need prior
  // state (turns or quota row) override before POST.
  mockedHistorySelect.mockResolvedValue({ data: [], error: null });
  mockedInsert.mockImplementation(async () => ({ error: null }));
  mockedQuotaFetch.mockResolvedValue({ data: null, error: null });
  mockedQuotaInsert.mockImplementation(async () => ({ error: null }));
  mockedQuotaUpdate.mockImplementation(async () => ({ error: null }));
});

afterEach(() => {
  vi.restoreAllMocks();
  mockedCallPersonaMultiTurn.mockReset();
  mockedApplySafetyFilter.mockReset();
  mockedHistorySelect.mockReset();
  mockedInsert.mockReset();
  mockedQuotaFetch.mockReset();
  mockedQuotaInsert.mockReset();
  mockedQuotaUpdate.mockReset();
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

describe('POST /api/aurora/chat — Tier 0 quota (W3 Thu)', () => {
  it('returns 429 + Aurora-style redirect when quota >= 10 (TIER_0_DAILY_QUOTA)', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 10, haiku_count: 7, sonnet_count: 3 },
      error: null,
    });

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '안녕',
      }) as never,
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.character).toBe('aurora');
    expect(body.triggered).toBe(false);
    expect(body.text).toContain('quota');
    expect(body.text).toContain('본인 plan');
    expect(body.text).toContain('내일');

    // Quota-exhausted user must NOT invoke Claude (cost-save primary intent).
    expect(mockedCallPersonaMultiTurn).not.toHaveBeenCalled();
    // Quota path still persists the user message + redirect (history continuity).
    expect(mockedInsert).toHaveBeenCalledOnce();
    // No quota increment on 429 — we don't penalize the user for hitting the cap.
    expect(mockedQuotaInsert).not.toHaveBeenCalled();
    expect(mockedQuotaUpdate).not.toHaveBeenCalled();
  });

  it('boundary: count=9 passes through (under cap), count=10 returns 429', async () => {
    // count=9 → pass
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('응답 1');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 9, haiku_count: 6, sonnet_count: 3 },
      error: null,
    });

    const r1 = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '짧은 질문' }) as never,
    );
    expect(r1.status).toBe(200);
    expect(mockedCallPersonaMultiTurn).toHaveBeenCalledOnce();

    // count=10 → 429
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 10, haiku_count: 7, sonnet_count: 3 },
      error: null,
    });

    const r2 = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '다음 질문' }) as never,
    );
    expect(r2.status).toBe(429);
  });

  it('fail-open on quota fetch error (no lockout from supabase blip)', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('응답');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: null,
      error: new Error('supabase blip'),
    });

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    // Treated as count=0 → proceeds to Claude call.
    expect(res.status).toBe(200);
    expect(mockedCallPersonaMultiTurn).toHaveBeenCalledOnce();
  });
});

describe('POST /api/aurora/chat — model routing + quota increment (W3 Thu)', () => {
  it('routes short factual message to Haiku and increments haiku_count', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('짧은 응답');

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    expect(res.status).toBe(200);
    expect(mockedCallPersonaMultiTurn).toHaveBeenCalledOnce();
    const callArgs = mockedCallPersonaMultiTurn.mock.calls[0] as unknown as [
      string,
      string,
      Array<unknown>,
      string,
    ];
    expect(callArgs[3]).toBe('claude-haiku-4-5-20251001');
    // First turn → quota INSERT (not UPDATE — no prior row).
    expect(mockedQuotaInsert).toHaveBeenCalledOnce();
    const quotaRow = (mockedQuotaInsert.mock.calls as unknown as Array<Array<unknown>>)[0][0] as {
      tier: string;
      session_id: string;
      message_count: number;
      haiku_count: number;
      sonnet_count: number;
    };
    expect(quotaRow.tier).toBe('tier_0');
    expect(quotaRow.session_id).toBe(VALID_SESSION);
    expect(quotaRow.message_count).toBe(1);
    expect(quotaRow.haiku_count).toBe(1);
    expect(quotaRow.sonnet_count).toBe(0);
  });

  it('routes macro deep-dive (한미 금리차) to Sonnet and increments sonnet_count', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('깊은 응답');

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '한미 금리차 어때요?',
      }) as never,
    );

    expect(res.status).toBe(200);
    const callArgs = mockedCallPersonaMultiTurn.mock.calls[0] as unknown as [
      string,
      string,
      Array<unknown>,
      string,
    ];
    expect(callArgs[3]).toBe('claude-sonnet-4-6');
    expect(mockedQuotaInsert).toHaveBeenCalledOnce();
    const quotaRow = (mockedQuotaInsert.mock.calls as unknown as Array<Array<unknown>>)[0][0] as {
      haiku_count: number;
      sonnet_count: number;
    };
    expect(quotaRow.haiku_count).toBe(0);
    expect(quotaRow.sonnet_count).toBe(1);
  });

  it('UPDATEs existing quota row on subsequent turn (UPSERT path)', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('응답');
    // Route fetches quota twice per turn (Step 1.5 check + increment helper);
    // mockResolvedValue (persistent) so both fetches see the existing row.
    mockedQuotaFetch.mockResolvedValue({
      data: { id: 'q-existing', message_count: 3, haiku_count: 2, sonnet_count: 1 },
      error: null,
    });

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '짧은 질문' }) as never,
    );

    expect(res.status).toBe(200);
    expect(mockedQuotaUpdate).toHaveBeenCalledOnce();
    expect(mockedQuotaInsert).not.toHaveBeenCalled();
  });

  it('still increments quota on output-side BLOCK (Claude was called)', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER) // input pass
      .mockResolvedValueOnce(BLOCK_FILTER); // output BLOCK
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('soft advisory phrasing');

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '본인 plan 페이스?' }) as never,
    );

    expect(res.status).toBe(200);
    // Output BLOCK trips Layer 3 redirect AND increments quota (cost was real).
    expect(mockedQuotaInsert).toHaveBeenCalledOnce();
  });

  it('does NOT increment quota on input-side BLOCK (no Claude call)', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(BLOCK_FILTER);

    const res = await POST(
      makeRequest({
        sessionId: VALID_SESSION,
        message: '지금 매수해야 할까',
      }) as never,
    );

    expect(res.status).toBe(200);
    // Input filter rejected — Layer 2 Haiku classifier cost is system-side,
    // user wasn't charged a turn.
    expect(mockedQuotaInsert).not.toHaveBeenCalled();
    expect(mockedQuotaUpdate).not.toHaveBeenCalled();
  });
});
