import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock state — reset per test
let mockUser: { id: string } | null = { id: 'user-uuid-test' };
let mockExistingRow: { channels: string[] } | null = null;
const mockedUpsert = vi.fn(async () => ({ error: null as { message: string } | null }));
const mockedSelectMaybeSingle = vi.fn(async () => ({
  data: mockExistingRow,
  error: null,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => {
  const fromMock = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: mockedSelectMaybeSingle,
      })),
    })),
    upsert: mockedUpsert,
  }));
  return {
    createAdminClient: vi.fn(() => ({ from: fromMock })),
  };
});

import { POST } from '../route';

function makeRequest(body: unknown, isRawString = false): Request {
  return new Request('http://localhost/api/notification/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: isRawString ? (body as string) : JSON.stringify(body),
  });
}

const VALID_SUB = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
  expirationTime: null,
};

beforeEach(() => {
  mockUser = { id: 'user-uuid-test' };
  mockExistingRow = null;
  mockedUpsert.mockResolvedValue({ error: null });
  mockedSelectMaybeSingle.mockImplementation(async () => ({
    data: mockExistingRow,
    error: null,
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/notification/subscribe — auth', () => {
  it('unauthenticated → 401', async () => {
    mockUser = null;
    const res = await POST(makeRequest({ subscription: VALID_SUB }) as never);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('unauthorized');
  });
});

describe('POST /api/notification/subscribe — body validation', () => {
  it('malformed JSON → 400 invalid_json', async () => {
    const res = await POST(makeRequest('not-json{{', true) as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_json');
  });

  it('missing endpoint → 400 invalid_subscription', async () => {
    const res = await POST(
      makeRequest({ subscription: { keys: VALID_SUB.keys } }) as never,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_subscription');
  });

  it('endpoint not https → 400 invalid_subscription', async () => {
    const res = await POST(
      makeRequest({
        subscription: { ...VALID_SUB, endpoint: 'http://insecure.example.com' },
      }) as never,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_subscription');
  });

  it('keys.p256dh missing → 400 invalid_subscription', async () => {
    const res = await POST(
      makeRequest({
        subscription: { ...VALID_SUB, keys: { auth: 'auth-key' } },
      }) as never,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_subscription');
  });

  it('keys.auth missing → 400 invalid_subscription', async () => {
    const res = await POST(
      makeRequest({
        subscription: { ...VALID_SUB, keys: { p256dh: 'p256dh-key' } },
      }) as never,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid_subscription');
  });
});

describe('POST /api/notification/subscribe — upsert success path', () => {
  it('valid auth + valid subscription → 200 + upsert called', async () => {
    const res = await POST(makeRequest({ subscription: VALID_SUB }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-uuid-test',
        web_push_subscription: VALID_SUB,
        channels: ['web_push'],
      }),
      { onConflict: 'user_id' },
    );
  });

  it('preserves existing channels[] — adds "web_push" only if absent', async () => {
    mockExistingRow = { channels: ['email'] };
    const res = await POST(makeRequest({ subscription: VALID_SUB }) as never);
    expect(res.status).toBe(200);
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        channels: ['email', 'web_push'],
      }),
      { onConflict: 'user_id' },
    );
  });

  it('does not duplicate "web_push" if already present', async () => {
    mockExistingRow = { channels: ['email', 'web_push'] };
    const res = await POST(makeRequest({ subscription: VALID_SUB }) as never);
    expect(res.status).toBe(200);
    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        channels: ['email', 'web_push'],
      }),
      { onConflict: 'user_id' },
    );
  });
});

describe('POST /api/notification/subscribe — DB error', () => {
  it('upsert error → 500 db_upsert_failed', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedUpsert.mockResolvedValue({
      error: { message: 'unique violation' },
    });
    const res = await POST(makeRequest({ subscription: VALID_SUB }) as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('db_upsert_failed');
    expect(errSpy).toHaveBeenCalled();
  });
});
