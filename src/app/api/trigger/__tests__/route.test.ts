import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Supabase mock ──────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();

function makeChain() {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    single: mockSingle,
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  return chain;
}

let dbChain = makeChain();

let mockUser: { id: string } | null = { id: 'user-uuid-test' };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: vi.fn(() => dbChain),
  })),
}));

import { DELETE, GET, PATCH, POST } from '../route';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

function makeRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const VALID_PRICE_DROP_BODY = {
  trigger_type: 'price_drop',
  condition_params: { ticker: 'AAPL', threshold_pct: 10, window_hours: 24 },
  cooldown_hours: 24,
};

const STUB_TRIGGER = {
  id: 'trigger-uuid-1',
  user_id: 'user-uuid-test',
  trigger_type: 'price_drop',
  condition_params: { ticker: 'AAPL', threshold_pct: 10, window_hours: 24 },
  cooldown_hours: 24,
  last_fired_at: null,
  is_active: true,
  label: null,
  created_at: '2026-05-26T00:00:00Z',
  updated_at: '2026-05-26T00:00:00Z',
};

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockUser = { id: 'user-uuid-test' };
  dbChain = makeChain();
  mockSelect.mockReset();
  mockInsert.mockReset();
  mockUpdate.mockReset();
  mockSingle.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/trigger — authentication', () => {
  it('unauthenticated → 401', async () => {
    mockUser = null;
    dbChain.order.mockResolvedValue({ data: [], error: null });
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('unauthorized');
  });
});

describe('GET /api/trigger — success', () => {
  it('authenticated → 200 with triggers array', async () => {
    dbChain.order.mockResolvedValue({ data: [STUB_TRIGGER], error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.triggers)).toBe(true);
    expect(json.triggers[0].trigger_type).toBe('price_drop');
  });
});

describe('GET /api/trigger — db error', () => {
  it('db error → 500 db_error', async () => {
    dbChain.order.mockResolvedValue({ data: null, error: { message: 'connection lost' } });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('db_error');
  });
});

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/trigger — authentication', () => {
  it('unauthenticated → 401', async () => {
    mockUser = null;
    const req = makeRequest('POST', makeUrl('/api/trigger'), VALID_PRICE_DROP_BODY);
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('unauthorized');
  });
});

describe('POST /api/trigger — invalid JSON', () => {
  it('malformed body → 400 invalid_json', async () => {
    const req = new Request(makeUrl('/api/trigger'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{{bad json',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_json');
  });
});

describe('POST /api/trigger — trigger_type validation', () => {
  it('missing trigger_type → 400 invalid_trigger_type', async () => {
    const req = makeRequest('POST', makeUrl('/api/trigger'), {
      condition_params: { ticker: 'AAPL', threshold_pct: 5, window_hours: 24 },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_trigger_type');
  });

  it('invalid trigger_type string → 400', async () => {
    const req = makeRequest('POST', makeUrl('/api/trigger'), {
      trigger_type: 'fomo_panic',
      condition_params: {},
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_trigger_type');
  });

  it('disclosure trigger accepted → proceeds to db (deferred V1.5)', async () => {
    mockSingle.mockResolvedValue({ data: { ...STUB_TRIGGER, trigger_type: 'disclosure' }, error: null });
    const req = makeRequest('POST', makeUrl('/api/trigger'), {
      trigger_type: 'disclosure',
      condition_params: { ticker: 'TSLA', disclosure_type: 'SEC_13F' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
  });
});

describe('POST /api/trigger — condition_params validation', () => {
  it('missing condition_params → 400 invalid_condition_params', async () => {
    const req = makeRequest('POST', makeUrl('/api/trigger'), { trigger_type: 'price_drop' });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_condition_params');
  });

  it('condition_params is non-object → 400', async () => {
    const req = makeRequest('POST', makeUrl('/api/trigger'), {
      trigger_type: 'price_drop',
      condition_params: 'string-is-wrong',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_condition_params');
  });
});

describe('POST /api/trigger — cooldown_hours validation', () => {
  it('cooldown_hours below min (0) → 400', async () => {
    const req = makeRequest('POST', makeUrl('/api/trigger'), {
      ...VALID_PRICE_DROP_BODY,
      cooldown_hours: 0,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_cooldown_hours');
  });

  it('cooldown_hours above max (169) → 400', async () => {
    const req = makeRequest('POST', makeUrl('/api/trigger'), {
      ...VALID_PRICE_DROP_BODY,
      cooldown_hours: 169,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_cooldown_hours');
  });

  it('default cooldown_hours=24 when omitted → 201', async () => {
    mockSingle.mockResolvedValue({ data: STUB_TRIGGER, error: null });
    const body = { trigger_type: 'price_drop', condition_params: { ticker: 'AAPL', threshold_pct: 5, window_hours: 24 } };
    const req = makeRequest('POST', makeUrl('/api/trigger'), body);
    const res = await POST(req as never);
    expect(res.status).toBe(201);
  });
});

describe('POST /api/trigger — success', () => {
  it('valid body → 201 with created trigger', async () => {
    mockSingle.mockResolvedValue({ data: STUB_TRIGGER, error: null });
    const req = makeRequest('POST', makeUrl('/api/trigger'), VALID_PRICE_DROP_BODY);
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.trigger.trigger_type).toBe('price_drop');
  });
});

describe('POST /api/trigger — db error', () => {
  it('db insert error → 500', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'unique violation' } });
    const req = makeRequest('POST', makeUrl('/api/trigger'), VALID_PRICE_DROP_BODY);
    const res = await POST(req as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('db_error');
  });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/trigger — authentication', () => {
  it('unauthenticated → 401', async () => {
    mockUser = null;
    const req = makeRequest('PATCH', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }), { cooldown_hours: 48 });
    const res = await PATCH(req as never);
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/trigger — missing id', () => {
  it('no id param → 400 missing_id', async () => {
    const req = makeRequest('PATCH', makeUrl('/api/trigger'), { cooldown_hours: 48 });
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('missing_id');
  });
});

describe('PATCH /api/trigger — no valid fields', () => {
  it('empty patch body → 400 no_fields', async () => {
    const req = makeRequest('PATCH', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }), {});
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('no_fields');
  });

  it('only unknown fields → 400 no_fields', async () => {
    const req = makeRequest('PATCH', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }), {
      unknown_field: 'value',
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('no_fields');
  });
});

describe('PATCH /api/trigger — validation', () => {
  it('invalid trigger_type in patch → 400', async () => {
    const req = makeRequest('PATCH', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }), {
      trigger_type: 'fomo',
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_trigger_type');
  });

  it('cooldown_hours out of range → 400', async () => {
    const req = makeRequest('PATCH', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }), {
      cooldown_hours: 200,
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_cooldown_hours');
  });
});

describe('PATCH /api/trigger — success', () => {
  it('valid partial update → 200', async () => {
    mockSingle.mockResolvedValue({ data: { ...STUB_TRIGGER, cooldown_hours: 48 }, error: null });
    const req = makeRequest('PATCH', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }), {
      cooldown_hours: 48,
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.trigger.cooldown_hours).toBe(48);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/trigger — authentication', () => {
  it('unauthenticated → 401', async () => {
    mockUser = null;
    const req = makeRequest('DELETE', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }));
    const res = await DELETE(req as never);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/trigger — missing id', () => {
  it('no id param → 400 missing_id', async () => {
    const req = makeRequest('DELETE', makeUrl('/api/trigger'));
    const res = await DELETE(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('missing_id');
  });
});

describe('DELETE /api/trigger — success (soft-delete)', () => {
  it('valid id → 200 deleted: true', async () => {
    dbChain.eq.mockReturnThis();
    // The final .eq() in DELETE chain returns { error: null }
    const lastEqChain = { error: null };
    dbChain.eq
      .mockReturnValueOnce(dbChain)
      .mockReturnValueOnce(lastEqChain);
    const req = makeRequest('DELETE', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }));
    const res = await DELETE(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});

describe('DELETE /api/trigger — db error', () => {
  it('db error → 500', async () => {
    dbChain.eq
      .mockReturnValueOnce(dbChain)
      .mockReturnValueOnce({ error: { message: 'foreign key violation' } });
    const req = makeRequest('DELETE', makeUrl('/api/trigger', { id: 'trigger-uuid-1' }));
    const res = await DELETE(req as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('db_error');
  });
});
