import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const fromMock = vi.fn();
const createAdminClientMock = vi.fn(() => ({
  from: fromMock,
}));
const getMacroSnapshotMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/macro/snapshot', () => ({
  getMacroSnapshot: () => getMacroSnapshotMock(),
}));

function makeReq(authHeader?: string) {
  return new NextRequest('http://localhost/api/cron/evaluate-triggers', {
    method: 'GET',
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

function makeTrigger(overrides: Record<string, unknown> = {}) {
  return {
    id: 'trigger-uuid-1',
    user_id: 'user-uuid-1',
    trigger_type: 'macro_composite',
    condition_params: { direction: 'below', threshold: 50 },
    cooldown_hours: 24,
    last_fired_at: null,
    is_active: true,
    label: null,
    created_at: '2026-05-26T00:00:00.000Z',
    updated_at: '2026-05-26T00:00:00.000Z',
    ...overrides,
  };
}

function setupSupabaseMock({
  selectResult = { data: [], error: null },
  updateResult = { error: null },
  insertResult = { error: null },
}: {
  selectResult?: { data: unknown[] | null; error: { message: string } | null };
  updateResult?: { error: { message: string } | null };
  insertResult?: { error: { message: string } | null };
} = {}) {
  const shapeUpdateEqMock = vi.fn().mockResolvedValue(updateResult);
  const shapeUpdateMock = vi.fn().mockReturnValue({ eq: shapeUpdateEqMock });
  const shapeInMock = vi.fn().mockResolvedValue(selectResult);

  const shapeTriggersChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: shapeInMock,
    update: shapeUpdateMock,
  };

  const behavioralInsertMock = vi.fn().mockResolvedValue(insertResult);
  const behavioralEventChain = {
    insert: behavioralInsertMock,
  };

  fromMock.mockImplementation((table: string) => {
    if (table === 'shape_c_triggers') return shapeTriggersChain;
    if (table === 'behavioral_event') return behavioralEventChain;
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    shapeInMock,
    shapeUpdateMock,
    shapeUpdateEqMock,
    behavioralInsertMock,
  };
}

async function callGET(req: NextRequest) {
  const { GET } = await import('../evaluate-triggers/route');
  return GET(req);
}

describe('/api/cron/evaluate-triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T10:00:00.000Z'));
    process.env.CRON_SECRET = 'test-secret';
    getMacroSnapshotMock.mockResolvedValue({ composite: { score: 35 } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 401 when Authorization header is missing', async () => {
    setupSupabaseMock();
    const res = await callGET(makeReq());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it('returns 401 when CRON_SECRET does not match', async () => {
    setupSupabaseMock();
    const res = await callGET(makeReq('Bearer wrong-secret'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it('returns 200 with evaluated/fired/skipped zero when active triggers are empty', async () => {
    setupSupabaseMock({ selectResult: { data: [], error: null } });
    const res = await callGET(makeReq('Bearer test-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ evaluated: 0, fired: 0, skipped: 0 });
  });

  it('fires macro trigger and inserts behavioral_event audit row', async () => {
    const trigger = makeTrigger({
      id: 'trigger-uuid-2',
      condition_params: { direction: 'below', threshold: 50 },
      cooldown_minutes: 10,
      last_fired_at: null,
    });
    const { shapeUpdateMock, behavioralInsertMock } = setupSupabaseMock({
      selectResult: { data: [trigger], error: null },
      updateResult: { error: null },
      insertResult: { error: null },
    });
    getMacroSnapshotMock.mockResolvedValue({ composite: { score: 30 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      evaluated: 1,
      fired: 1,
      skipped: 0,
      firedIds: ['trigger-uuid-2'],
    });
    expect(shapeUpdateMock).toHaveBeenCalledTimes(1);
    expect(behavioralInsertMock).toHaveBeenCalledTimes(1);
    expect(behavioralInsertMock).toHaveBeenCalledWith({
      user_id: 'user-uuid-1',
      trigger_id: 'trigger-uuid-2',
      event_type: 'trigger_fired',
      severity: 'info',
      context_jsonb: {
        trigger_type: 'macro_composite',
        macro_composite_score: 30,
        cooldown_reason: 'never_fired',
        fired_at: '2026-05-26T10:00:00.000Z',
      },
    });
  });

  it('skips trigger when enforceCooldown is active and does not insert behavioral_event', async () => {
    const trigger = makeTrigger({
      id: 'trigger-uuid-3',
      cooldown_minutes: 10,
      last_fired_at: '2026-05-26T09:55:00.000Z',
      condition_params: { direction: 'below', threshold: 50 },
    });
    const { shapeUpdateMock, behavioralInsertMock } = setupSupabaseMock({
      selectResult: { data: [trigger], error: null },
    });
    getMacroSnapshotMock.mockResolvedValue({ composite: { score: 30 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fired).toBe(0);
    expect(body.skipped).toBe(1);
    expect(shapeUpdateMock).not.toHaveBeenCalled();
    expect(behavioralInsertMock).not.toHaveBeenCalled();
  });

  it('keeps response non-fatal when behavioral_event insert fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const trigger = makeTrigger({
      id: 'trigger-uuid-4',
      condition_params: { direction: 'below', threshold: 50 },
      cooldown_minutes: 5,
      last_fired_at: null,
    });
    const { behavioralInsertMock } = setupSupabaseMock({
      selectResult: { data: [trigger], error: null },
      updateResult: { error: null },
      insertResult: { error: { message: 'insert failed' } },
    });
    getMacroSnapshotMock.mockResolvedValue({ composite: { score: 25 } });

    const res = await callGET(makeReq('Bearer test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      evaluated: 1,
      fired: 1,
      skipped: 0,
      firedIds: ['trigger-uuid-4'],
    });
    expect(behavioralInsertMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
