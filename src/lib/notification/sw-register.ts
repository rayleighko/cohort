/**
 * Service Worker registration + Web Push subscription helper.
 * Client-side only — safe to import in React components.
 *
 * Server-side notification dispatch lives in @/lib/notification/dispatcher.
 */

export interface SubscriptionResult {
  success: boolean;
  subscription?: PushSubscriptionJSON;
  error?: string;
}

export interface UnsubscribeResult {
  success: boolean;
  error?: string;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.error('[sw-register] registration failed:', err);
    return null;
  }
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export async function subscribeWebPush(): Promise<SubscriptionResult> {
  if (!VAPID_PUBLIC_KEY) {
    return { success: false, error: 'vapid_public_key_not_set' };
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return { success: false, error: 'service_worker_registration_failed' };
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    return { success: false, error: `notification_permission_${permission}` };
  }

  try {
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    return { success: true, subscription: subscription.toJSON() };
  } catch (err) {
    return { success: false, error: (err as Error).message || 'subscribe_failed' };
  }
}

export async function unsubscribeWebPush(): Promise<UnsubscribeResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { success: false, error: 'service_worker_unavailable' };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      return { success: true };
    }
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return { success: true };
    }
    const ok = await subscription.unsubscribe();
    return ok ? { success: true } : { success: false, error: 'unsubscribe_returned_false' };
  } catch (err) {
    return { success: false, error: (err as Error).message || 'unsubscribe_failed' };
  }
}
