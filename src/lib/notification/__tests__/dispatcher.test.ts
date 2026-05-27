import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatch } from '../dispatcher';
import { ProviderRegistry } from '../providers/provider';
import type {
  ChannelTarget,
  NotificationPayload,
  ProviderSendResult,
} from '../types';
import type { NotificationProvider } from '../providers/provider';

const adminFromMock = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: adminFromMock }),
}));

interface PrefRow {
  user_id: string;
  channels: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  web_push_subscription: { endpoint: string } | null;
  kakao_user_id: string | null;
  opt_out: boolean;
  updated_at: string;
  created_at: string;
}

function makePref(overrides: Partial<PrefRow> = {}): PrefRow {
  return {
    user_id: 'user-1',
    channels: ['web_push'],
    quiet_hours_start: null,
    quiet_hours_end: null,
    web_push_subscription: { endpoint: 'https://push.example/abc' },
    kakao_user_id: null,
    opt_out: false,
    updated_at: '2026-05-27T00:00:00Z',
    created_at: '2026-05-27T00:00:00Z',
    ...overrides,
  };
}

function setupSupabaseMock(opts: {
  pref?: PrefRow | null;
  prefError?: { message: string } | null;
  insertResult?: { data: { id: string } | null; error: { message: string } | null };
}) {
  const prefMaybeSingle = vi.fn().mockResolvedValue({
    data: opts.pref ?? null,
    error: opts.prefError ?? null,
  });
  const prefChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: prefMaybeSingle,
  };

  const insertSingle = vi
    .fn()
    .mockResolvedValue(
      opts.insertResult ?? { data: { id: 'log-1' }, error: null },
    );
  const insertChain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: insertSingle,
  };

  adminFromMock.mockImplementation((table: string) => {
    if (table === 'user_notification_preference') return prefChain;
    if (table === 'notification_log') return insertChain;
    throw new Error(`Unexpected table: ${table}`);
  });

  return { prefMaybeSingle, insertChain, insertSingle };
}

class StubWebPushProvider implements NotificationProvider {
  readonly channel = 'web_push' as const;
  enabled = true;
  send = vi.fn(
    async (
      _payload: NotificationPayload,
      _target: ChannelTarget,
    ): Promise<ProviderSendResult> => ({ success: true }),
  );
}

class StubKakaoProvider implements NotificationProvider {
  readonly channel = 'kakao_alimtalk' as const;
  enabled = true;
  send = vi.fn(
    async (): Promise<ProviderSendResult> => ({ success: true }),
  );
}

function registryWith(...providers: NotificationProvider[]): ProviderRegistry {
  const r = new ProviderRegistry();
  for (const p of providers) r.register(p);
  return r;
}

describe('dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty result when user has opted out', async () => {
    const { insertChain } = setupSupabaseMock({ pref: makePref({ opt_out: true }) });
    const result = await dispatch(
      { user_id: 'user-1', category: 'trigger_alert' },
      registryWith(new StubWebPushProvider()),
    );
    expect(result).toEqual({
      dispatched: [],
      succeeded: 0,
      failed: 0,
      notification_log_ids: [],
    });
    expect(insertChain.insert).not.toHaveBeenCalled();
  });

  it('returns empty result when channels array is empty', async () => {
    const { insertChain } = setupSupabaseMock({ pref: makePref({ channels: [] }) });
    const result = await dispatch(
      { user_id: 'user-1', category: 'trigger_alert' },
      registryWith(new StubWebPushProvider()),
    );
    expect(result.notification_log_ids).toEqual([]);
    expect(insertChain.insert).not.toHaveBeenCalled();
  });

  it('returns empty result when preference row is missing', async () => {
    const { insertChain } = setupSupabaseMock({ pref: null });
    const result = await dispatch(
      { user_id: 'user-1', category: 'trigger_alert' },
      registryWith(new StubWebPushProvider()),
    );
    expect(result.dispatched).toEqual([]);
    expect(insertChain.insert).not.toHaveBeenCalled();
  });

  it('returns empty result when preference load errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setupSupabaseMock({ pref: null, prefError: { message: 'db_down' } });
    const result = await dispatch(
      { user_id: 'user-1', category: 'trigger_alert' },
      registryWith(new StubWebPushProvider()),
    );
    expect(result.dispatched).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns empty result when no provider is registered for the requested channel', async () => {
    const { insertChain } = setupSupabaseMock({ pref: makePref() });
    const result = await dispatch(
      { user_id: 'user-1', category: 'trigger_alert' },
      registryWith(),
    );
    expect(result.notification_log_ids).toEqual([]);
    expect(insertChain.insert).not.toHaveBeenCalled();
  });

  it('inserts a notification_log row for each resolved target', async () => {
    const { insertChain } = setupSupabaseMock({
      pref: makePref({
        channels: ['web_push', 'kakao_alimtalk'],
        kakao_user_id: 'kakao-user-1',
      }),
    });
    const result = await dispatch(
      {
        user_id: 'user-1',
        category: 'trigger_alert',
        context_jsonb: {
          macro_composite_score: -3.0,
          stance: 'hawkish',
          trigger_type: 'macro_composite',
        },
      },
      registryWith(new StubWebPushProvider(), new StubKakaoProvider()),
    );

    expect(insertChain.insert).toHaveBeenCalledTimes(2);
    expect(result.dispatched).toHaveLength(2);
    expect(result.notification_log_ids).toEqual(['log-1', 'log-1']);
  });

  it('persists resolved voice and body in the notification_log INSERT', async () => {
    const { insertChain } = setupSupabaseMock({ pref: makePref() });
    await dispatch(
      {
        user_id: 'user-1',
        category: 'trigger_alert',
        context_jsonb: { macro_composite_score: -3.2, stance: 'hawkish' },
      },
      registryWith(new StubWebPushProvider()),
    );

    const insertArg = (insertChain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as Record<string, unknown>;
    expect(insertArg.voice).toBe('vesper');
    expect(typeof insertArg.body).toBe('string');
    expect(insertArg.body).not.toBe('TODO ST2');
    expect(insertArg.channel).toBe('web_push');
    expect(insertArg.category).toBe('trigger_alert');
    expect(insertArg.status).toBe('pending');
    expect(insertArg.user_id).toBe('user-1');
  });

  it('skips channel when its provider is not registered as enabled', async () => {
    const { insertChain } = setupSupabaseMock({
      pref: makePref({
        channels: ['web_push', 'kakao_alimtalk'],
        kakao_user_id: 'kakao-user-1',
      }),
    });
    await dispatch(
      { user_id: 'user-1', category: 'trigger_alert' },
      registryWith(new StubWebPushProvider()),
    );
    expect(insertChain.insert).toHaveBeenCalledTimes(1);
    const insertArg = (insertChain.insert as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as Record<string, unknown>;
    expect(insertArg.channel).toBe('web_push');
  });

  it('continues other targets and logs error when one notification_log INSERT fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const insertSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
      .mockResolvedValueOnce({ data: { id: 'log-ok' }, error: null });
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: insertSingle,
    };
    const prefChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: makePref({
          channels: ['web_push', 'kakao_alimtalk'],
          kakao_user_id: 'kakao-user-1',
        }),
        error: null,
      }),
    };
    adminFromMock.mockImplementation((table: string) => {
      if (table === 'user_notification_preference') return prefChain;
      if (table === 'notification_log') return insertChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await dispatch(
      { user_id: 'user-1', category: 'trigger_alert' },
      registryWith(new StubWebPushProvider(), new StubKakaoProvider()),
    );

    expect(insertSingle).toHaveBeenCalledTimes(2);
    expect(result.notification_log_ids).toEqual(['log-ok']);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
