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

const mockedPostHogCapture = vi.fn();
const mockedPostHogShutdown = vi.fn(async () => {});

vi.mock('@/lib/analytics/posthog-server', () => ({
  getServerPostHog: vi.fn(() => ({
    capture: mockedPostHogCapture,
    shutdown: mockedPostHogShutdown,
  })),
}));

vi.mock('@/lib/aurora/chat-quota', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/aurora/chat-quota')>();
  return {
    ...actual,
    resolveUserTier: vi.fn(actual.resolveUserTier),
  };
});

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
import { resolveUserTier } from '@/lib/aurora/chat-quota';

const mockedCallPersonaMultiTurn = vi.mocked(callPersonaMultiTurn);
const mockedApplySafetyFilter = vi.mocked(applySafetyFilter);
const mockedResolveUserTier = vi.mocked(resolveUserTier);

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
  // Chat is anonymous-only in V1 → resolveUserTier(null) returns 'tier_0'.
  // Per-tier tests override this per case.
  mockedResolveUserTier.mockResolvedValue('tier_0');
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
  mockedResolveUserTier.mockReset();
  mockedPostHogCapture.mockReset();
  mockedPostHogShutdown.mockReset();
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

describe('POST /api/aurora/chat — per-tier quota (vault 62 §1 Q3, 2026-05-25)', () => {
  it('Tier 0 anonymous: returns 429 chat_quota_exceeded at 5 msg/day cap', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedResolveUserTier.mockResolvedValueOnce('tier_0');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 5, haiku_count: 3, sonnet_count: 2 },
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
    expect(body.error).toBe('chat_quota_exceeded');
    expect(body.character).toBe('aurora');
    expect(body.triggered).toBe(false);
    expect(body.tier).toBe('tier_0');
    expect(body.daily_count).toBe(5);
    expect(body.daily_limit).toBe(5);
    expect(body.text).toContain('quota');
    expect(body.text).toContain('본인 plan');
    expect(body.text).toContain('내일');
    // reset_at must be a valid ISO timestamp in the future.
    expect(typeof body.reset_at).toBe('string');
    expect(new Date(body.reset_at).getTime()).toBeGreaterThan(Date.now());

    expect(mockedCallPersonaMultiTurn).not.toHaveBeenCalled();
    expect(mockedInsert).toHaveBeenCalledOnce();
    expect(mockedQuotaInsert).not.toHaveBeenCalled();
    expect(mockedQuotaUpdate).not.toHaveBeenCalled();
  });

  it('Tier 1 free signup: returns 429 at 20 msg/day cap', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedResolveUserTier.mockResolvedValueOnce('tier_1');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 20, haiku_count: 12, sonnet_count: 8 },
      error: null,
    });

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe('chat_quota_exceeded');
    expect(body.tier).toBe('tier_1');
    expect(body.daily_limit).toBe(20);
    expect(mockedCallPersonaMultiTurn).not.toHaveBeenCalled();
  });

  it('Tier 2 Pro: returns 429 at 100 msg/day cap', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedResolveUserTier.mockResolvedValueOnce('tier_2_pro');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: {
        id: 'q-1',
        message_count: 100,
        haiku_count: 60,
        sonnet_count: 40,
      },
      error: null,
    });

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.tier).toBe('tier_2_pro');
    expect(body.daily_limit).toBe(100);
  });

  it('Tier 3 Premium: never blocks (unlimited V1 defer per vault 53 §1)', async () => {
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('응답');
    mockedResolveUserTier.mockResolvedValueOnce('tier_3_premium');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: {
        id: 'q-1',
        message_count: 9999,
        haiku_count: 5000,
        sonnet_count: 4999,
      },
      error: null,
    });

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    expect(res.status).toBe(200);
    expect(mockedCallPersonaMultiTurn).toHaveBeenCalledOnce();
    // Unlimited tier emits NO quota events (Number.isFinite guard).
    expect(mockedPostHogCapture).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'chat_quota_hit' }),
    );
    expect(mockedPostHogCapture).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'chat_quota_blocked' }),
    );
  });

  it('boundary tier_0: count=3 passes silently, count=4 passes + chat_quota_hit (80%), count=5 returns 429', async () => {
    // count=3 — under 80% threshold, request proceeds, no quota event
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('응답 1');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 3, haiku_count: 2, sonnet_count: 1 },
      error: null,
    });

    const r1 = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '짧은 질문' }) as never,
    );
    expect(r1.status).toBe(200);
    expect(mockedPostHogCapture).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'chat_quota_hit' }),
    );

    // count=4 — at 80% threshold, request proceeds + chat_quota_hit fires
    mockedPostHogCapture.mockClear();
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('응답 2');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 4, haiku_count: 3, sonnet_count: 1 },
      error: null,
    });

    const r2 = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '다음 질문' }) as never,
    );
    expect(r2.status).toBe(200);
    expect(mockedPostHogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'chat_quota_hit',
        properties: expect.objectContaining({
          tier: 'tier_0',
          daily_count: 4,
          daily_limit: 5,
          threshold: '80',
        }),
      }),
    );

    // count=5 — at cap, returns 429
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 5, haiku_count: 3, sonnet_count: 2 },
      error: null,
    });

    const r3 = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '한 번 더' }) as never,
    );
    expect(r3.status).toBe(429);
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

describe('POST /api/aurora/chat — PostHog quota events (vault 62 §1 Q4)', () => {
  it('emits chat_quota_hit + chat_quota_blocked at 100% cap', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedResolveUserTier.mockResolvedValueOnce('tier_0');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 5, haiku_count: 3, sonnet_count: 2 },
      error: null,
    });

    const res = await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    expect(res.status).toBe(429);
    // Both events fire on the 429 path.
    expect(mockedPostHogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'chat_quota_hit',
        properties: expect.objectContaining({
          tier: 'tier_0',
          daily_count: 5,
          daily_limit: 5,
          threshold: '100',
        }),
      }),
    );
    expect(mockedPostHogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'chat_quota_blocked',
        properties: expect.objectContaining({
          tier: 'tier_0',
          daily_count: 5,
          daily_limit: 5,
        }),
      }),
    );
  });

  it('uses sessionId-prefixed distinctId for anonymous tier_0 users', async () => {
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedResolveUserTier.mockResolvedValueOnce('tier_0');
    mockedQuotaFetch.mockResolvedValueOnce({
      data: { id: 'q-1', message_count: 5, haiku_count: 3, sonnet_count: 2 },
      error: null,
    });

    await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    expect(mockedPostHogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'chat_quota_blocked',
        distinctId: `aurora-chat-${VALID_SESSION}`,
      }),
    );
  });
});

describe('POST /api/aurora/chat — model routing + quota increment (W3 Thu)', () => {
  // V1 default (vault 62 §2.1) forces Sonnet regardless of message. These
  // tests exercise the V1.5 heuristic path — enable the routing env flag
  // for the whole describe; restore after each.
  const ORIGINAL_FLAG = process.env.AURORA_MODEL_ROUTING_ENABLED;
  beforeEach(() => {
    process.env.AURORA_MODEL_ROUTING_ENABLED = 'true';
  });
  afterEach(() => {
    if (ORIGINAL_FLAG === undefined) {
      delete process.env.AURORA_MODEL_ROUTING_ENABLED;
    } else {
      process.env.AURORA_MODEL_ROUTING_ENABLED = ORIGINAL_FLAG;
    }
  });

  it('V1 default (env flag off) forces Sonnet even on short factual message', async () => {
    delete process.env.AURORA_MODEL_ROUTING_ENABLED;
    mockedApplySafetyFilter
      .mockResolvedValueOnce(ALLOW_FILTER)
      .mockResolvedValueOnce(ALLOW_FILTER);
    mockedCallPersonaMultiTurn.mockResolvedValueOnce('짧은 응답');

    await POST(
      makeRequest({ sessionId: VALID_SESSION, message: '안녕' }) as never,
    );

    const callArgs = mockedCallPersonaMultiTurn.mock.calls[0] as unknown as [
      string,
      string,
      Array<unknown>,
      string,
    ];
    expect(callArgs[3]).toBe('claude-sonnet-4-6');
  });

  it('routes short factual message to Haiku and increments haiku_count (V1.5 heuristic)', async () => {
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
