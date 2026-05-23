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
      normalized: 1.6,
      weight: 0.25,
      contribution: 0.4,
    },
    {
      source: 'ecos',
      code: 'USDKRW',
      latest: 1342.5,
      normalized: 0.5,
      weight: 0.3,
      contribution: 0.15,
    },
  ],
  computedAt: '2026-05-23T01:00:00.000Z',
  asOfDate: '2026-05-22',
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
});

describe('POST /api/aurora/narration', () => {
  it('returns 200 + narration + triggered=false on safe Claude output', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 한국 매크로 composite는 +2.3 (중립–비둘기). 한미 금리차가 핵심 driver. 본인 plan 페이스 유지해보세요.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce({
      decision: 'ALLOW',
      category: 'INFORMATIONAL',
      layer1: 'CLEAR_PASS',
      layer2: null,
      redirectText: null,
    });

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.character).toBe('aurora');
    expect(body.triggered).toBe(false);
    expect(body.zone).toBe('neutral-dovish');
    expect(body.text).toContain('cohort');
    expect(mockedCallPersona).toHaveBeenCalledWith(
      'aurora',
      expect.stringContaining('차분'),
      expect.stringContaining('neutral-dovish'),
    );
  });

  it('redirects + triggered=true when Claude output contains forbidden phrasing (deterministic guard)', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 한국 매크로 composite는 +2.3. 비중 30%로 늘리세요.',
    );

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triggered).toBe(true);
    expect(body.character).toBe('aurora');
    expect(body.text).toContain('본인 plan');
    expect(body.text).toContain('Cohort');
    // applySafetyFilter should NOT be called when containsForbiddenOutput
    // already triggered the redirect.
    expect(mockedApplySafetyFilter).not.toHaveBeenCalled();
  });

  it('redirects + triggered=true when applySafetyFilter Layer 2 classifies output as ADVISORY_REQUEST', async () => {
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 한미 금리차 1.05% 좁아짐 — 본인 plan 페이스 어떻게 보세요? 지금 결정하실 시점일 수 있어요.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce({
      decision: 'BLOCK',
      category: 'ADVISORY_REQUEST',
      layer1: 'AMBIGUOUS',
      layer2: 'ADVISORY_REQUEST',
      redirectText: 'REDIRECT_FROM_FILTER',
    });

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triggered).toBe(true);
    expect(body.text).toBe('REDIRECT_FROM_FILTER');
    expect(mockedApplySafetyFilter).toHaveBeenCalledOnce();
  });

  it('returns 503 + Korean fallback when callPersona throws (Claude API failure)', async () => {
    mockedCallPersona.mockRejectedValueOnce(new Error('Anthropic 429 rate limit'));

    const res = await POST(
      makeRequest({ composite: SAMPLE_COMPOSITE }) as never,
    );

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('narration_unavailable');
    expect(body.text).toContain('Aurora가 잠시 자리를 비웠습니다');
    expect(body.retryHint).toBeTruthy();
    expect(mockedApplySafetyFilter).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid_body (non-JSON)', async () => {
    const req = new Request('http://localhost/api/aurora/narration', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_body');
  });

  it('returns 400 on missing composite field', async () => {
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_composite');
  });

  it('returns 400 on composite with wrong zone enum', async () => {
    const bad = { ...SAMPLE_COMPOSITE, zone: 'super-dovish' };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_composite');
  });

  it('returns 400 on composite with non-numeric score', async () => {
    const bad = { ...SAMPLE_COMPOSITE, score: 'high' };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_composite');
  });

  it('returns 400 on composite missing keyDriver', async () => {
    const { keyDriver: _kd, ...rest } = SAMPLE_COMPOSITE;
    const res = await POST(makeRequest({ composite: rest }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_composite');
  });

  it('returns 400 on composite with non-array indicators', async () => {
    const bad = { ...SAMPLE_COMPOSITE, indicators: {} };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on composite with empty indicators array', async () => {
    const bad = { ...SAMPLE_COMPOSITE, indicators: [] };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on composite with > MAX_INDICATORS indicators (DoS guard)', async () => {
    const bad = {
      ...SAMPLE_COMPOSITE,
      indicators: Array.from({ length: 17 }, () => SAMPLE_COMPOSITE.indicators[0]),
    };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_composite');
  });

  it('returns 400 on composite with overlong indicator code (DoS guard)', async () => {
    const bad = {
      ...SAMPLE_COMPOSITE,
      indicators: [
        { ...SAMPLE_COMPOSITE.indicators[0], code: 'A'.repeat(65) },
      ],
    };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on composite with non-boolean degraded', async () => {
    const bad = { ...SAMPLE_COMPOSITE, degraded: 'yes' };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on composite with non-array missingIndicators', async () => {
    const bad = {
      ...SAMPLE_COMPOSITE,
      degraded: true,
      missingIndicators: 'oops',
    };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('returns 400 on composite with non-finite score (NaN)', async () => {
    const bad = { ...SAMPLE_COMPOSITE, score: Number.NaN };
    const res = await POST(makeRequest({ composite: bad }) as never);
    expect(res.status).toBe(400);
  });

  it('sets cache-control: no-store on every response (advisory-adjacent guard)', async () => {
    mockedCallPersona.mockResolvedValueOnce('오늘 cohort. 안전한 narration.');
    mockedApplySafetyFilter.mockResolvedValueOnce({
      decision: 'ALLOW',
      category: 'INFORMATIONAL',
      layer1: 'CLEAR_PASS',
      layer2: null,
      redirectText: null,
    });
    const res = await POST(makeRequest({ composite: SAMPLE_COMPOSITE }) as never);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('preserves degraded flag in composite serialization without breaking validation', async () => {
    const degraded: MacroComposite = {
      ...SAMPLE_COMPOSITE,
      degraded: true,
      missingIndicators: ['fred:DTWEXBGS'],
    };
    mockedCallPersona.mockResolvedValueOnce(
      '오늘 cohort. 일부 지표 누락 상태로 composite 산정. 본인 plan 페이스 유지해보세요.',
    );
    mockedApplySafetyFilter.mockResolvedValueOnce({
      decision: 'ALLOW',
      category: 'INFORMATIONAL',
      layer1: 'CLEAR_PASS',
      layer2: null,
      redirectText: null,
    });

    const res = await POST(makeRequest({ composite: degraded }) as never);

    expect(res.status).toBe(200);
    const callArgs = mockedCallPersona.mock.calls[0];
    expect(callArgs[2]).toContain('주의');
  });
});
