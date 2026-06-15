import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mutable upsert mock — reset per test
const mockedUpsert = vi.fn(async () => ({ error: null as { message: string } | null }));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: mockedUpsert,
    })),
  })),
}));

// Auth mock — mutable user state
let mockUser: { id: string } | null = { id: 'user-uuid-test' };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
  })),
}));

vi.mock('@/lib/pipa-redact', () => ({
  redactPortfolioCompositionPct: vi.fn((raw: Record<string, number>) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== 'number') continue;
      if (v < 0 || v > 100) continue;
      out[k] = Math.round(v * 100) / 100;
    }
    return out;
  }),
}));

vi.mock('@/lib/analytics/posthog-server', () => ({
  getServerPostHog: vi.fn(() => ({
    capture: vi.fn(),
    shutdown: vi.fn(async () => undefined),
  })),
}));

import { POST } from '../route';

/** Minimal valid GL-RTS payload for fit-user survey tests */
function validGlRtsPayload() {
  return {
    q1: 'a',
    q2: 'a',
    q3: 'a',
    q4: 'a',
    q5: 'a',
    q6: 'a',
    q7: 'a',
    q8: 'a',
    q9: 'a',
    q10: 'a',
    q11: 'a',
    q12: 'a',
    q13: 'a',
  };
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/survey', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockUser = { id: 'user-uuid-test' };
  mockedUpsert.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/survey — authentication', () => {
  it('unauthenticated request → 401', async () => {
    mockUser = null;
    const req = makeRequest({ q0_user_stage: 'learning' });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('unauthorized');
  });
});

describe('POST /api/survey — Q0 narrow filter (vault 61 D16)', () => {
  it('Q0 = "learning" with full survey → fit ✓, user_stage stored', async () => {
    const req = makeRequest({
      q0_user_stage: 'learning',
      gl_rts_answers: validGlRtsPayload(),
      q1_time_horizon: '10y+',
      q8_framework_affinity: ['buffett_index_value'],
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fit).toBe(true);
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_stage: 'learning',
        time_horizon: '10y+',
      }),
    );
  });

  it('Q0 = "learning" without GL-RTS → 400 invalid_gl_rts_answers', async () => {
    const req = makeRequest({ q0_user_stage: 'learning' });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_gl_rts_answers');
  });

  it('Q0 = "post_learning_planned" → fit ✓, Q1-Q10 upserted', async () => {
    const req = makeRequest({
      q0_user_stage: 'post_learning_planned',
      gl_rts_answers: validGlRtsPayload(),
      q1_time_horizon: '10y+',
      q8_framework_affinity: ['buffett_index_value'],
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fit).toBe(true);
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_stage: 'post_learning_planned',
        time_horizon: '10y+',
        framework_affinity: ['buffett_index_value'],
      }),
    );
  });

  it('Q0 = "active_investor_enforcement" → fit ✓✓ primary', async () => {
    const req = makeRequest({
      q0_user_stage: 'active_investor_enforcement',
      gl_rts_answers: validGlRtsPayload(),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fit).toBe(true);
    expect(json.next).toBe('dashboard_or_onboarding_continue');
  });

  it('missing q0_user_stage → 400', async () => {
    const req = makeRequest({ q1_time_horizon: '5y' });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_q0_user_stage');
  });

  it('invalid q0_user_stage value → 400', async () => {
    const req = makeRequest({ q0_user_stage: 'beginner' });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_q0_user_stage');
  });
});

describe('POST /api/survey — PIPA Q2 portfolio composition', () => {
  it('Q2 sum 95-105% → accepted', async () => {
    const req = makeRequest({
      q0_user_stage: 'post_learning_planned',
      gl_rts_answers: validGlRtsPayload(),
      q2_portfolio_composition_pct: { KOSPI: 60, US: 30, cash: 10 },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fit).toBe(true);
  });

  it('PIPA — Q2 portfolio sum < 95% → 400 invalid_portfolio_composition', async () => {
    const req = makeRequest({
      q0_user_stage: 'post_learning_planned',
      gl_rts_answers: validGlRtsPayload(),
      q2_portfolio_composition_pct: { KOSPI: 50, US: 30 },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_portfolio_composition');
    expect(json.detail).toContain('100% ±5');
  });

  it('PIPA — Q2 absolute amount sniff (value > 100) → 400 pipa_violation_absolute_amount', async () => {
    const req = makeRequest({
      q0_user_stage: 'post_learning_planned',
      gl_rts_answers: validGlRtsPayload(),
      q2_portfolio_composition_pct: { KOSPI: 50000000, cash: 10 },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('pipa_violation_absolute_amount');
    expect(json.detail).toContain('KOSPI');
  });

  it('PIPA — Q2 sum > 105% → 400 invalid_portfolio_composition', async () => {
    const req = makeRequest({
      q0_user_stage: 'post_learning_planned',
      gl_rts_answers: validGlRtsPayload(),
      q2_portfolio_composition_pct: { KOSPI: 70, US: 40 },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_portfolio_composition');
  });
});

describe('POST /api/survey — Q8 framework_affinity 7 categories (vault 57 §3 Q5)', () => {
  it('valid 7-category values + unsure → insert success', async () => {
    const req = makeRequest({
      q0_user_stage: 'active_investor_enforcement',
      gl_rts_answers: validGlRtsPayload(),
      q8_framework_affinity: ['druckenmiller_macro_13f', 'unsure'],
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fit).toBe(true);
  });

  it('all 7 valid framework values accepted', async () => {
    const req = makeRequest({
      q0_user_stage: 'active_investor_enforcement',
      gl_rts_answers: validGlRtsPayload(),
      q8_framework_affinity: [
        'druckenmiller_macro_13f',
        'kimdante_macro_korea_us',
        'buffett_index_value',
        'dalio_all_weather',
        'kostolany_psychology_cycle',
        'technical_fundamental',
        'unsure',
      ],
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });

  it('q8 invalid value → 400 invalid_framework_affinity', async () => {
    const req = makeRequest({
      q0_user_stage: 'active_investor_enforcement',
      q8_framework_affinity: ['invalid_framework'],
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_framework_affinity');
    expect(json.detail).toContain('invalid_framework');
  });

  it('q8 mixed valid + invalid → 400 on first invalid', async () => {
    const req = makeRequest({
      q0_user_stage: 'active_investor_enforcement',
      q8_framework_affinity: ['buffett_index_value', 'no_such_framework'],
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_framework_affinity');
  });
});

describe('POST /api/survey — DB error handling', () => {
  it('upsert DB error → 500 db_error', async () => {
    mockedUpsert.mockResolvedValue({ error: { message: 'DB constraint violation' } });
    const req = makeRequest({
      q0_user_stage: 'post_learning_planned',
      gl_rts_answers: validGlRtsPayload(),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('db_error');
  });
});

describe('POST /api/survey — GL-RTS integration (Task 4)', () => {
  it('missing gl_rts_answers → 400 invalid_gl_rts_answers', async () => {
    const req = makeRequest({ q0_user_stage: 'post_learning_planned' });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_gl_rts_answers');
  });

  it('q10_target_outcome → stored as service_expectations array', async () => {
    const req = makeRequest({
      q0_user_stage: 'post_learning_planned',
      gl_rts_answers: validGlRtsPayload(),
      q10_target_outcome: '매크로 변화를 놓치지 않고 plan대로 집행',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        service_expectations: ['매크로 변화를 놓치지 않고 plan대로 집행'],
        profile_version: 'glrts-ko-v0.1',
      }),
    );
  });
});

describe('POST /api/survey — invalid JSON', () => {
  it('malformed JSON body → 400 invalid_json', async () => {
    const req = new Request('http://localhost/api/survey', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-valid-json{{{',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_json');
  });
});
