import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MacroComposite } from '@/lib/macro/composite';

vi.mock('@/lib/claude/client', () => ({
  callPersona: vi.fn(),
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

// Service-role Supabase admin client — Day 9 best-effort persistence into
// aurora_narration_log. Default mock: insert returns no error; select → [].
const mockedInsert = vi.fn(async () => ({ error: null as Error | null }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockedInsert,
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(async () => ({ data: [], error: null })),
    })),
  })),
}));

const mockedGetCachedMorningBrief = vi.hoisted(() =>
  vi.fn(async () => null as Awaited<
    ReturnType<
      typeof import('@/lib/aurora/narration-cache').getCachedMorningBriefResponse
    >
  >),
);

vi.mock('@/lib/aurora/narration-cache', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/lib/aurora/narration-cache')
  >();
  return {
    ...actual,
    getCachedMorningBriefResponse: mockedGetCachedMorningBrief,
  };
});

import { POST } from '../route';
import { callPersona } from '@/lib/claude/client';
import { applySafetyFilter } from '@/lib/claude/safety-filter';

const mockedCallPersona = vi.mocked(callPersona);
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
      observationDate: '2026-05-22',
      normalized: 1.6,
      weight: 0.25,
      contribution: 0.4,
    },
    {
      source: 'ecos',
      code: 'USDKRW',
      latest: 1342.5,
      observationDate: '2026-05-22',
      normalized: 0.5,
      weight: 0.3,
      contribution: 0.15,
    },
  ],
  computedAt: '2026-05-23T01:00:00.000Z',
  asOfDate: '2026-05-22',
};

const YESTERDAY_COMPOSITE: MacroComposite = {
  ...SAMPLE_COMPOSITE,
  score: 1.1,
  zone: 'neutral',
  keyDriver: { source: 'fred', code: 'VIXCLS', contribution: 0.55 },
  asOfDate: '2026-05-21',
  computedAt: '2026-05-22T01:00:00.000Z',
};

function makeHistory(n: number): MacroComposite[] {
  const out: MacroComposite[] = [];
  for (let i = n; i > 0; i--) {
    out.push({
      ...SAMPLE_COMPOSITE,
      score: 1 + Math.sin(i),
      asOfDate: `2026-05-${String(31 - i).padStart(2, '0')}`,
    });
  }
  return out;
}

const ALLOW_FILTER = {
  decision: 'ALLOW' as const,
  category: 'INFORMATIONAL' as const,
  layer1: 'CLEAR_PASS' as const,
  layer2: null,
  redirectText: null,
};

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/aurora/narration', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  mockedCallPersona.mockReset();
  mockedApplySafetyFilter.mockReset();
  mockedInsert.mockReset();
  mockedInsert.mockImplementation(async () => ({ error: null }));
  mockedGetCachedMorningBrief.mockReset();
  mockedGetCachedMorningBrief.mockImplementation(async () => null);
});

describe('POST /api/aurora/narration — Day 7 backward compatibility', () => {
  it('returns cached morning_brief without calling Claude when asOfDate match exists', async () => {
    mockedGetCachedMorningBrief.mockResolvedValueOnce({
      character: 'aurora',
      text: '캐시된 오늘 brief.',
      triggered: false,
      zone: 'neutral-dovish',
      category: 'morning_brief',
    });

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe('캐시된 오늘 brief.');
    expect(mockedCallPersona).not.toHaveBeenCalled();
    expect(mockedInsert).not.toHaveBeenCalled();
  });

  it('returns 200 + narration + triggered=false + category=morning_brief on default (no category)', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 한국 매크로 composite는 +2.3 (중립–비둘기). 한미 금리차가 핵심 driver. 본인 plan 페이스 유지해보세요.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.character).toBe('aurora');
    expect(body.triggered).toBe(false);
    expect(body.zone).toBe('neutral-dovish');
    expect(body.category).toBe('morning_brief');
    expect(body.text).toContain('cohort');
    expect(mockedInsert).toHaveBeenCalledOnce();
    expect(mockedInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'morning_brief',
        character: 'aurora',
        triggered: false,
      }),
    );
  });

  it('redirects when output trips containsForbiddenOutput (deterministic guard)', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 비중 30%로 늘리세요.',
    );

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triggered).toBe(true);
    expect(body.category).toBe('morning_brief');
    expect(body.text).toContain('본인 plan');
    expect(mockedApplySafetyFilter).not.toHaveBeenCalled();
    expect(mockedInsert).toHaveBeenCalledOnce();
  });

  it('returns 503 + Korean fallback when callPersona throws (no persistence on 503)', async () => {
    mockedCallPersona.mockRejectedValueOnce(new Error('Anthropic 429'));

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('narration_unavailable');
    expect(body.text).toContain('Aurora가 잠시 자리를 비웠습니다');
    expect(mockedInsert).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid_body / missing composite / wrong zone enum', async () => {
    const r1 = await POST(
      new Request('http://localhost/api/aurora/narration', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not json',
      }) as never,
    );
    expect(r1.status).toBe(400);
    expect((await r1.json()).error).toBe('invalid_body');

    const r2 = await POST(makeRequest({}) as never);
    expect(r2.status).toBe(400);
    expect((await r2.json()).error).toBe('invalid_composite');

    const r3 = await POST(
      makeRequest({ composite: { ...SAMPLE_COMPOSITE, zone: 'super-dovish' } }) as never,
    );
    expect(r3.status).toBe(400);
  });
});

describe('POST /api/aurora/narration — Day 9 category routing', () => {
  it('rejects unknown category with 400 + allowed list', async () => {
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'panic_mode',
      }) as never,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_category');
    expect(body.allowed).toEqual([
      'morning_brief',
      'single_indicator_focus',
      'score_change',
      'weekly_summary',
    ]);
    expect(mockedCallPersona).not.toHaveBeenCalled();
    expect(mockedInsert).not.toHaveBeenCalled();
  });

  it('handles single_indicator_focus: 200 with indicator field + persistence category=single_indicator_focus', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      'VIX 변동성 지수는 17.80 수준. composite 전체에 작은 contribution. 본인 plan 페이스 유지해보세요.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);

    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'single_indicator_focus',
        indicator: SAMPLE_COMPOSITE.indicators[0],
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe('single_indicator_focus');
    expect(body.triggered).toBe(false);
    expect(mockedInsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'single_indicator_focus' }),
    );
  });

  it('rejects single_indicator_focus without indicator field (400)', async () => {
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'single_indicator_focus',
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_indicator');
    expect(mockedCallPersona).not.toHaveBeenCalled();
  });

  it('rejects single_indicator_focus with malformed indicator (400)', async () => {
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'single_indicator_focus',
        indicator: { source: 'fred', code: 'X' }, // missing required numeric fields
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_indicator');
  });

  it('handles score_change: 200 with yesterday composite + persistence', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 어제 +1.10에서 오늘 +2.34로 +1.24 변동. 한미 금리차 기여가 컸어요. 본인 plan 페이스 유지해보세요.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);

    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'score_change',
        yesterday: YESTERDAY_COMPOSITE,
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe('score_change');
    expect(mockedInsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'score_change' }),
    );
  });

  it('rejects score_change without yesterday (400)', async () => {
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'score_change',
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_yesterday');
  });

  it('rejects score_change with malformed yesterday composite (400)', async () => {
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'score_change',
        yesterday: { score: 'high' },
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_yesterday');
  });

  it('handles weekly_summary: 200 with 7-entry history + persistence', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '지난 7일 한국 매크로는 중립권 흐름. 한미 금리차가 일관된 driver. 본인 plan 페이스 유지해보세요. 같이 호흡합니다.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);

    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'weekly_summary',
        history: makeHistory(7),
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe('weekly_summary');
    expect(mockedInsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'weekly_summary' }),
    );
  });

  it('rejects weekly_summary with history < 3 entries (400)', async () => {
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'weekly_summary',
        history: makeHistory(2),
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_history');
  });

  it('rejects weekly_summary with history > 14 entries (400, prompt-inflation guard)', async () => {
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'weekly_summary',
        history: makeHistory(20),
      }) as never,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_history');
  });

  it('rejects weekly_summary when history contains a malformed composite (400)', async () => {
    const bad = makeHistory(7);
    (bad[3] as Partial<MacroComposite>).score = NaN;
    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'weekly_summary',
        history: bad,
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it('passes category through to applySafetyFilter Layer 2 BLOCK + persists triggered=true', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 한미 금리차가 좁아져 본인 plan 다시 보세요.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce({
      decision: 'BLOCK',
      category: 'ADVISORY_REQUEST',
      layer1: 'AMBIGUOUS',
      layer2: 'ADVISORY_REQUEST',
      redirectText: 'REDIRECT',
    });

    const res = await POST(
      makeRequest({
        composite: SAMPLE_COMPOSITE,
        category: 'score_change',
        yesterday: YESTERDAY_COMPOSITE,
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triggered).toBe(true);
    expect(body.text).toBe('REDIRECT');
    expect(body.category).toBe('score_change');
    expect(mockedInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'score_change',
        triggered: true,
        safety_filter_category: 'ADVISORY_REQUEST',
      }),
    );
  });
});

describe('POST /api/aurora/narration — Day 9 persistence (best-effort)', () => {
  it('returns 200 even when aurora_narration_log INSERT fails (best-effort, non-fatal)', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 안전한 narration.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedInsert.mockResolvedValueOnce({
      error: new Error('Supabase RLS denial'),
    });

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triggered).toBe(false);
    expect(body.text).toContain('cohort');
  });

  it('returns 200 even when admin client throws (best-effort, non-fatal)', async () => {
    mockedCallPersona.mockResolvedValueOnce('오늘 cohort. 안전한 narration.');
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedInsert.mockRejectedValueOnce(new Error('Network down'));

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
  });

  it('persists composite_snapshot as the full composite JSON', async () => {
    mockedCallPersona.mockResolvedValueOnce('오늘 cohort. 안전한 narration.');
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);

    await POST(makeRequest({ composite: SAMPLE_COMPOSITE }) as never);

    expect(mockedInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        composite_snapshot: SAMPLE_COMPOSITE,
      }),
    );
  });

  it('fires aurora_narration_persistence_failed PostHog event only on insert failure', async () => {
    const captureSpy = vi.fn();
    const shutdownSpy = vi.fn(async () => {});
    const { getServerPostHog } = await import('@/lib/analytics/posthog-server');
    vi.mocked(getServerPostHog).mockReturnValueOnce({
      capture: captureSpy,
      shutdown: shutdownSpy,
    } as unknown as ReturnType<typeof getServerPostHog>);

    mockedCallPersona.mockResolvedValueOnce('오늘 cohort. 안전한 narration.');
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    mockedInsert.mockResolvedValueOnce({
      error: new Error('Supabase RLS denial'),
    });

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const events = captureSpy.mock.calls.map((c) => c[0]?.event);
    expect(events).toContain('aurora_narration_generated');
    expect(events).toContain('aurora_narration_persistence_failed');
  });

  it('does NOT fire aurora_narration_persistence_failed when insert succeeds', async () => {
    const captureSpy = vi.fn();
    const shutdownSpy = vi.fn(async () => {});
    const { getServerPostHog } = await import('@/lib/analytics/posthog-server');
    vi.mocked(getServerPostHog).mockReturnValueOnce({
      capture: captureSpy,
      shutdown: shutdownSpy,
    } as unknown as ReturnType<typeof getServerPostHog>);

    mockedCallPersona.mockResolvedValueOnce('오늘 cohort. 안전한 narration.');
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    // default mockedInsert returns { error: null }

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const events = captureSpy.mock.calls.map((c) => c[0]?.event);
    expect(events).toContain('aurora_narration_generated');
    expect(events).not.toContain('aurora_narration_persistence_failed');
  });
});

describe('POST /api/aurora/narration — Day 8 regressions (Tier 0 DoS guards)', () => {
  it('returns 400 on > MAX_INDICATORS indicators', async () => {
    const bad = {
      ...SAMPLE_COMPOSITE,
      indicators: Array.from({ length: 17 }, () => SAMPLE_COMPOSITE.indicators[0]),
    };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on overlong indicator code', async () => {
    const bad = {
      ...SAMPLE_COMPOSITE,
      indicators: [
        { ...SAMPLE_COMPOSITE.indicators[0], code: 'A'.repeat(65) },
      ],
    };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on non-boolean degraded / non-array missingIndicators', async () => {
    const r1 = await POST(
      makeRequest({ composite: { ...SAMPLE_COMPOSITE, degraded: 'yes' } }) as never,
    );
    expect(r1.status).toBe(400);

    const r2 = await POST(
      makeRequest({
        composite: { ...SAMPLE_COMPOSITE, degraded: true, missingIndicators: 'oops' },
      }) as never,
    );
    expect(r2.status).toBe(400);
  });

  it('returns 400 on non-finite (NaN) score', async () => {
    const res = await POST(
      makeRequest({ composite: { ...SAMPLE_COMPOSITE, score: Number.NaN } }) as never,
    );
    expect(res.status).toBe(400);
  });

  it('sets cache-control: no-store on every response (advisory-adjacent guard)', async () => {
    mockedCallPersona.mockResolvedValueOnce('오늘 cohort. 안전한 narration.');
    mockedApplySafetyFilter.mockResolvedValueOnce(ALLOW_FILTER);
    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
