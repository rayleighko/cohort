// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const VAPID_TEST_KEY =
  'BIyMOTr6aI3b5JwkQv947QWUE9fcfTc-sYt6Wb-i0FXp7EYnZJE7bBu8D9pnInb7hweWRx85wSNMnLNbZm3Xqyw';

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

function stubServiceWorkerNavigator(
  registration: ServiceWorkerRegistration,
  registerImpl?: () => Promise<ServiceWorkerRegistration>,
) {
  const register = registerImpl ?? vi.fn(async () => registration);
  vi.stubGlobal('navigator', {
    serviceWorker: {
      register,
      ready: Promise.resolve(registration),
    },
  });
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

  it('returns ServiceWorkerRegistration on success after ready', async () => {
    const registration = makeRegistration();
    const register = vi.fn(async () => registration);
    stubServiceWorkerNavigator(registration, register);
    const { registerServiceWorker } = await import('../sw-register');
    const res = await registerServiceWorker();
    expect(res).toBe(registration);
    expect(register).toHaveBeenCalledWith('/service-worker.js', { scope: '/' });
  });

  it('returns null on register reject and logs error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const register = vi.fn(async () => {
      throw new Error('reg-failed');
    });
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register,
        ready: new Promise(() => {
          /* never resolves — register throws first */
        }),
      },
    });
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
  beforeEach(() => {
    if (!('PushManager' in globalThis)) {
      vi.stubGlobal('PushManager', class PushManager {});
    }
  });

  it('returns vapid_public_key_not_set when VAPID env unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('vapid_public_key_not_set');
  });

  it('returns vapid_public_key_invalid when public key is malformed', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'not-a-valid-vapid-key');
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('vapid_public_key_invalid');
  });

  it('returns push_not_supported when PushManager missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', VAPID_TEST_KEY);
    // @ts-expect-error — simulate unsupported browser
    delete globalThis.PushManager;
    const { subscribeWebPush } = await import('../sw-register');
    const res = await subscribeWebPush();
    expect(res.success).toBe(false);
    expect(res.error).toBe('push_not_supported');
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
    stubServiceWorkerNavigator(registration);
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
    stubServiceWorkerNavigator(registration);
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
    stubServiceWorkerNavigator(registration);
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
    stubServiceWorkerNavigator(registration);
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

describe('formatPushErrorMessage', () => {
  it('maps known internal codes to Korean copy', async () => {
    const { formatPushErrorMessage } = await import('../sw-register');
    expect(formatPushErrorMessage('vapid_public_key_not_set')).toContain('VAPID');
    expect(formatPushErrorMessage('notification_permission_denied')).toContain('권한');
    expect(formatPushErrorMessage('no active Service Worker')).toContain('새로고침');
    expect(formatPushErrorMessage('Registration failed - push service not available')).toContain(
      'FCM',
    );
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
