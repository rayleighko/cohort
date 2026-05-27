// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const VAPID_TEST_KEY =
  'BIqNQTjV-Q6JZsX2gqL4lLpEKnD2YxJ8cFqMzKvNgY8tRwK9rJlPmHkS7uVwAaBbCcDdEeFfGgHhIiJjKk';

function makeSubscription(endpoint = 'https://push.example.com/abc') {
  return {
    endpoint,
    toJSON() {
      return {
        endpoint,
        keys: { p256dh: 'p256dh-stub', auth: 'auth-stub' },
        expirationTime: null,
      };
    },
  };
}

function makeRegistration(
  overrides: {
    getSubscription?: (...args: unknown[]) => unknown;
    subscribe?: (...args: unknown[]) => unknown;
  } = {},
) {
  return {
    pushManager: {
      getSubscription: overrides.getSubscription ?? vi.fn(async () => null),
      subscribe: overrides.subscribe ?? vi.fn(async () => makeSubscription()),
    },
  } as unknown as ServiceWorkerRegistration;
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', VAPID_TEST_KEY);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('registerServiceWorker', () => {
  it('returns null when serviceWorker not in navigator', async () => {
    vi.stubGlobal('navigator', {});
    const { registerServiceWorker } = await import('../sw-register');
    const res = await registerServiceWorker();
    expect(res).toBeNull();
  });

  it('returns ServiceWorkerRegistration on success', async () => {
    const registration = makeRegistration();
    const register = vi.fn(async () => registration);
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    const { registerServiceWorker } = await import('../sw-register');
    const res = await registerServiceWorker();
    expect(res).toBe(registration);
    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
  });

  it('returns null on register reject and logs error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const register = vi.fn(async () => {
      throw new Error('reg-failed');
    });
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    const { registerServiceWorker } = await import('../sw-register');
    const res = await registerServiceWorker();
    expect(res).toBeNull();
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('requestPushPermission', () => {
  it('returns "denied" when Notification not in window', async () => {
    // `vi.stubGlobal(name, undefined)` leaves the property name on window, so
    // `'Notification' in window` would still be true. Real browsers without
    // Notification support omit the property entirely — replicate via delete.
    delete (globalThis as Record<string, unknown>).Notification;
    const { requestPushPermission } = await import('../sw-register');
    const res = await requestPushPermission();
    expect(res).toBe('denied');
  });

  it('returns existing permission without re-prompting if granted', async () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission });
    const { requestPushPermission } = await import('../sw-register');
    const res = await requestPushPermission();
    expect(res).toBe('granted');
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('returns existing permission without re-prompting if denied', async () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    vi.stubGlobal('Notification', { permission: 'denied', requestPermission });
    const { requestPushPermission } = await import('../sw-register');
    const res = await requestPushPermission();
    expect(res).toBe('denied');
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('calls Notification.requestPermission when default', async () => {
    const requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    vi.stubGlobal('Notification', { permission: 'default', requestPermission });
    const { requestPushPermission } = await import('../sw-register');
    const res = await requestPushPermission();
    expect(res).toBe('granted');
    expect(requestPermission).toHaveBeenCalledOnce();
  });
});

describe('subscribeWebPush', () => {
  it('returns vapid_public_key_not_set when VAPID env unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('vapid_public_key_not_set');
  });

  it('returns service_worker_registration_failed when register returns null', async () => {
    vi.stubGlobal('navigator', {});
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('service_worker_registration_failed');
  });

  it('returns notification_permission_denied when permission != granted', async () => {
    const registration = makeRegistration();
    vi.stubGlobal('navigator', {
      serviceWorker: { register: vi.fn(async () => registration) },
    });
    vi.stubGlobal('Notification', {
      permission: 'denied',
      requestPermission: vi.fn(),
    });
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('notification_permission_denied');
  });

  it('returns existing subscription if present (idempotent)', async () => {
    const existing = makeSubscription('https://push.example.com/existing');
    const subscribe = vi.fn();
    const registration = makeRegistration({
      getSubscription: vi.fn(async () => existing),
      subscribe,
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { register: vi.fn(async () => registration) },
    });
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn(),
    });
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(true);
    expect(res.subscription?.endpoint).toBe('https://push.example.com/existing');
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('creates new subscription if none exists and returns success', async () => {
    const fresh = makeSubscription('https://push.example.com/fresh');
    const subscribe = vi.fn(async () => fresh);
    const registration = makeRegistration({
      getSubscription: vi.fn(async () => null),
      subscribe,
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { register: vi.fn(async () => registration) },
    });
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn(),
    });
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(true);
    expect(res.subscription?.endpoint).toBe('https://push.example.com/fresh');
    expect(subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      }),
    );
  });

  it('returns error message when subscribe throws', async () => {
    const subscribe = vi.fn(async () => {
      throw new Error('subscribe-blew-up');
    });
    const registration = makeRegistration({
      getSubscription: vi.fn(async () => null),
      subscribe,
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { register: vi.fn(async () => registration) },
    });
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn(),
    });
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('subscribe-blew-up');
  });
});

describe('unsubscribeWebPush', () => {
  it('returns success when no registration (already not registered)', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn(async () => null),
      },
    });
    const { unsubscribeWebPush } = await import('../sw-register');
    const res = await unsubscribeWebPush();
    expect(res.success).toBe(true);
  });

  it('returns success when registration exists but no subscription', async () => {
    const registration = {
      pushManager: { getSubscription: vi.fn(async () => null) },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn(async () => registration) },
    });
    const { unsubscribeWebPush } = await import('../sw-register');
    const res = await unsubscribeWebPush();
    expect(res.success).toBe(true);
  });

  it('calls subscription.unsubscribe() and returns success on true', async () => {
    const unsubscribe = vi.fn(async () => true);
    const registration = {
      pushManager: {
        getSubscription: vi.fn(async () => ({ unsubscribe })),
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn(async () => registration) },
    });
    const { unsubscribeWebPush } = await import('../sw-register');
    const res = await unsubscribeWebPush();
    expect(res.success).toBe(true);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('returns unsubscribe_returned_false when unsubscribe resolves false', async () => {
    const unsubscribe = vi.fn(async () => false);
    const registration = {
      pushManager: {
        getSubscription: vi.fn(async () => ({ unsubscribe })),
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn(async () => registration) },
    });
    const { unsubscribeWebPush } = await import('../sw-register');
    const res = await unsubscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('unsubscribe_returned_false');
  });

  it('returns service_worker_unavailable when serviceWorker missing', async () => {
    vi.stubGlobal('navigator', {});
    const { unsubscribeWebPush } = await import('../sw-register');
    const res = await unsubscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('service_worker_unavailable');
  });
});
