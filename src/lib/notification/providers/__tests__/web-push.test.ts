import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendNotificationMock = vi.fn();
const setVapidDetailsMock = vi.fn();

vi.mock('web-push', () => ({
  default: {
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
    setVapidDetails: (...args: unknown[]) => setVapidDetailsMock(...args),
  },
  sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
  setVapidDetails: (...args: unknown[]) => setVapidDetailsMock(...args),
}));

const VALID_SUB = JSON.stringify({
  endpoint: 'https://push.example/abc',
  keys: { p256dh: 'p', auth: 'a' },
});

async function loadProvider() {
  vi.resetModules();
  const mod = await import('../web-push');
  return new mod.WebPushProvider();
}

describe('WebPushProvider — enabled gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('is disabled when no VAPID env is set', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    const provider = await loadProvider();
    expect(provider.enabled).toBe(false);
  });

  it('is enabled when VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY are set', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pubkey-server');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'privkey');
    const provider = await loadProvider();
    expect(provider.enabled).toBe(true);
  });

  it('falls back to NEXT_PUBLIC_VAPID_PUBLIC_KEY when VAPID_PUBLIC_KEY is unset', async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'pubkey-client');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'privkey');
    const provider = await loadProvider();
    expect(provider.enabled).toBe(true);
  });
});

describe('WebPushProvider.send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pubkey');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'privkey');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:noreply@cohort.co.kr');
  });

  it('returns vapid_not_configured when env is missing', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('vapid_not_configured');
    expect(result.retryable).toBe(false);
  });

  it('returns invalid_subscription_payload when token is not valid JSON', async () => {
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: 'not-json' },
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_subscription_payload');
    expect(result.retryable).toBe(false);
  });

  it('returns success and reads location header on web-push resolve', async () => {
    sendNotificationMock.mockResolvedValueOnce({
      statusCode: 201,
      headers: { location: 'https://push.example/msg-123' },
      body: '',
    });
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    expect(result.success).toBe(true);
    expect(result.provider_message_id).toBe('https://push.example/msg-123');
    expect(setVapidDetailsMock).toHaveBeenCalledTimes(1);
  });

  it('sets title to Vesper 🦅 when voice is vesper', async () => {
    sendNotificationMock.mockResolvedValueOnce({
      statusCode: 201,
      headers: {},
      body: '',
    });
    const provider = await loadProvider();
    await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'hawk',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    const bodyJson = JSON.parse(sendNotificationMock.mock.calls[0]?.[1] as string);
    expect(bodyJson.title).toBe('Vesper 🦅');
    expect(bodyJson.body).toBe('hawk');
  });

  it('sets title to Aurora 🕊 when voice is aurora', async () => {
    sendNotificationMock.mockResolvedValueOnce({
      statusCode: 201,
      headers: {},
      body: '',
    });
    const provider = await loadProvider();
    await provider.send(
      {
        user_id: 'u1',
        category: 'morning_brief',
        voice: 'aurora',
        body: 'dove',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    const bodyJson = JSON.parse(sendNotificationMock.mock.calls[0]?.[1] as string);
    expect(bodyJson.title).toBe('Aurora 🕊');
  });

  it('classifies 410 Gone as non-retryable', async () => {
    sendNotificationMock.mockRejectedValueOnce({ statusCode: 410, body: 'gone' });
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    expect(result.success).toBe(false);
    expect(result.retryable).toBe(false);
  });

  it('classifies 404 Not Found as non-retryable', async () => {
    sendNotificationMock.mockRejectedValueOnce({ statusCode: 404, body: 'nf' });
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    expect(result.retryable).toBe(false);
  });

  it('classifies 403 Forbidden as non-retryable', async () => {
    sendNotificationMock.mockRejectedValueOnce({ statusCode: 403, body: 'forbid' });
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    expect(result.retryable).toBe(false);
  });

  it('classifies 503 (and other network errors) as retryable', async () => {
    sendNotificationMock.mockRejectedValueOnce({ statusCode: 503, body: 'down' });
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
  });

  it('classifies plain Error throw (no statusCode) as retryable', async () => {
    sendNotificationMock.mockRejectedValueOnce(new Error('network'));
    const provider = await loadProvider();
    const result = await provider.send(
      {
        user_id: 'u1',
        category: 'trigger_alert',
        voice: 'vesper',
        body: 'b',
        priority: 'normal',
      },
      { channel: 'web_push', provider_token: VALID_SUB },
    );
    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
    expect(result.error).toBe('network');
  });
});
