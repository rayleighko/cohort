/**
 * Unit tests — /api/cron/evaluate-triggers
 *
 * Covers:
 * 1. CRON_SECRET authentication (missing / wrong / correct)
 * 2. DB fetch failure path
 * 3. No active triggers → short-circuit
 * 4. macro_composite fires (score below threshold)
 * 5. macro_composite skipped (score above threshold, direction=below)
 * 6. macro_composite skipped (cooldown active)
 * 7. macro snapshot failure → non-fatal, triggers skipped
 * 8. DB update failure on fire → skipped count increments
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Supabase admin mock ───────────────────────────────────────────────────────

const mockIn = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();

function makeChain({
  selectResult = { data: [], error: null },
  updateResult = { error: null },
}: {
  selectResult?: { data: unknown[] | null; error: { message: string } | null };
  updateResult?: { error: { message: string } | null };
} = {}) {
  const updateChain = { eq: vi.fn().mockResolvedValue(updateResult) };
  mockUpdateEq.mockImplementation(() => updateChain.eq());

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue(selectResult),
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(updateResult) }),
  };
  return chain;
}

let dbChain = makeChain();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => dbChain),
  })),
}));

// ── Macro snapshot mock ───────────────────────────────────────────────────────

const mockGetMacroSnapshot = vi.fn();
vi.mock('@/lib/macro/snapshot', () => ({
  getMacroSnapshot: (...args: unknown[]) => mockGetMacroSnapshot(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(authHeader?: string) {
  return new NextRequest('http://localhost/api/cron/evaluate-triggers', {
    method: 'GET',
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

function makeTrigger(overrides: Record<string, unknown> = {}) {
  return {
    id: 'trigger-uuid-1',
    user_id: 'user-uuid',
    trigger_type: 'macro_composite',
    condition_params: { direction: 'below', threshold: 50 },
    cooldown_hours: 24,
    is_active: true,
    last_fired_at: null,
    label: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

async function callGET(req: NextRequest) {
  const { GET } = await import('../evaluate-triggers/route');
  return GET(req);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CRON_SECRET authentication', () => {
  const ORIGINAL_SECRET = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    vi.resetModules();
    dbChain = makeChain();
    mockGetMacroSnapshot.mockResolvedValue({ composite: { score: 60 } });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await callGET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
  });

  it('returns 401 when Bearer token is incorrect', async () => {
    const res = await callGET(makeReq('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when CRON_SECRET env is not set', async () => {
    delete process.env.CRON_SECRET;
    const res = await callGET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(401);
    process.env.CRON_SECRET = ORIGINAL_SECRET ?? 'test-secret';
  });

  it('proceeds (non-401) when correct Bearer token is provided', async () => {
    dbChain = makeChain({ selectResult: { data: [], error: null } });
    const res = await callGET(makeReq('Bearer test-secret'));
    expect(res.status).not.toBe(401);
  });
});

describe('DB fetch failure', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    vi.resetModules();
  });

  it('returns 500 when Supabase fetch fails', async () => {
    dbChain = makeChain({
      selectResult: { data: null, error: { message: 'connection error' } },
    });
    const res = await callGET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('db_fetch_failed');
  });
});

describe('no active triggers', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    vi.resetModules();
  });

  it('returns evaluated=0 fired=0 skipped=0 when no triggers', async () => {
    dbChain = makeChain({ selectResult: { data: [], error: null } });
    const res = await callGET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ evaluated: 0, fired: 0, skipped: 0 });
  });
});

describe('macro_composite trigger evaluation', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    vi.resetModules();
  });

  it('fires trigger when score is below threshold (direction=below)', async () => {
    const trigger = makeTrigger({ condition_params: { direction: 'below', threshold: 50 } });
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    dbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [trigger], error: null }),
      update: updateMock,
    } as unknown as typeof dbChain;

    mockGetMacroSnapshot.mockResolvedValue({ composite: { score: 35 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fired).toBe(1);
    expect(body.firedIds).toContain('trigger-uuid-1');
    expect(updateMock).toHaveBeenCalled();
  });

  it('skips trigger when score is above threshold (direction=below)', async () => {
    const trigger = makeTrigger({ condition_params: { direction: 'below', threshold: 50 } });

    dbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [trigger], error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    } as unknown as typeof dbChain;

    mockGetMacroSnapshot.mockResolvedValue({ composite: { score: 70 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    const body = await res.json();
    expect(body.fired).toBe(0);
    expect(body.skipped).toBe(1);
  });

  it('fires trigger when score is above threshold (direction=above)', async () => {
    const trigger = makeTrigger({
      id: 'trigger-uuid-2',
      condition_params: { direction: 'above', threshold: 60 },
    });
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    dbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [trigger], error: null }),
      update: updateMock,
    } as unknown as typeof dbChain;

    mockGetMacroSnapshot.mockResolvedValue({ composite: { score: 75 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    const body = await res.json();
    expect(body.fired).toBe(1);
    expect(body.firedIds).toContain('trigger-uuid-2');
  });

  it('skips trigger within cooldown window', async () => {
    const recentFire = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1h ago
    const trigger = makeTrigger({
      last_fired_at: recentFire,
      cooldown_hours: 24,
      condition_params: { direction: 'below', threshold: 50 },
    });

    dbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [trigger], error: null }),
      update: vi.fn(),
    } as unknown as typeof dbChain;

    mockGetMacroSnapshot.mockResolvedValue({ composite: { score: 30 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    const body = await res.json();
    expect(body.fired).toBe(0);
    expect(body.skipped).toBe(1);
  });
});

describe('macro snapshot failure', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    vi.resetModules();
  });

  it('is non-fatal: all macro_composite triggers skipped when snapshot throws', async () => {
    const trigger = makeTrigger({ condition_params: { direction: 'below', threshold: 50 } });

    dbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [trigger], error: null }),
      update: vi.fn(),
    } as unknown as typeof dbChain;

    mockGetMacroSnapshot.mockRejectedValue(new Error('ECOS API timeout'));

    const res = await callGET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fired).toBe(0);
    expect(body.skipped).toBe(1);
  });
});

describe('DB update failure on fire', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    vi.resetModules();
  });

  it('counts trigger as skipped when last_fired_at update fails', async () => {
    const trigger = makeTrigger({ condition_params: { direction: 'below', threshold: 50 } });
    const updateMock = vi
      .fn()
      .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'write failed' } }) });

    dbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [trigger], error: null }),
      update: updateMock,
    } as unknown as typeof dbChain;

    mockGetMacroSnapshot.mockResolvedValue({ composite: { score: 30 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    const body = await res.json();
    expect(body.fired).toBe(0);
    expect(body.skipped).toBe(1);
  });
});
