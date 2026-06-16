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

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

function isValidVapidPublicKey(key: string | undefined): key is string {
  if (!key) return false;
  try {
    const bytes = urlBase64ToUint8Array(key);
    // Uncompressed P-256 public key (0x04 + X + Y)
    return bytes.length === 65 && bytes[0] === 0x04;
  } catch {
    return false;
  }
}

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

/**
 * Registers `/service-worker.js` and waits until the worker is active.
 * PushManager.subscribe() requires an active SW — register() alone is not enough.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    return await navigator.serviceWorker.ready;
  } catch (err) {
    console.error('[sw-register] registration failed:', err);
    return null;
  }
}

/** Maps internal error codes to user-facing Korean copy (settings opt-in UI). */
export function formatPushErrorMessage(errorCode: string): string {
  if (errorCode === 'vapid_public_key_not_set') {
    return '푸시 알림 설정(VAPID)이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (errorCode === 'service_worker_registration_failed') {
    return '서비스 워커 등록에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.';
  }
  if (errorCode.startsWith('notification_permission_')) {
    return '브라우저 알림 권한이 필요합니다. 설정에서 허용한 뒤 다시 시도해 주세요.';
  }
  if (errorCode.includes('no active Service Worker')) {
    return '알림 준비가 끝나지 않았습니다. 잠시 후 다시 시도하거나 페이지를 새로고침해 주세요.';
  }
  if (
    errorCode.includes('push service not available') ||
    errorCode.includes('push service error')
  ) {
    return (
      '브라우저 푸시 서버(Google FCM 등)에 연결할 수 없습니다. ' +
      'Chrome/Edge라면 VPN·방화벽·Brave/AdGuard 차단 여부를 확인하고, ' +
      'Windows 알림 설정을 켠 뒤 시크릿 창이 아닌 일반 창에서 다시 시도해 주세요. ' +
      'Firefox에서도 같은 증상이면 네트워크/보안 프로그램을 점검해 주세요.'
    );
  }
  if (errorCode === 'vapid_public_key_invalid') {
    return 'VAPID 공개키 형식이 올바르지 않습니다. npx web-push generate-vapid-keys 로 새 키를 생성해 .env.local 을 갱신한 뒤 dev 서버를 재시작해 주세요.';
  }
  if (errorCode === 'push_not_supported') {
    return '이 브라우저/환경에서는 Web Push를 지원하지 않습니다. Chrome, Edge, Firefox 최신 버전에서 https 또는 localhost 로 접속해 주세요.';
  }
  if (errorCode === 'unauthorized') {
    return '로그인이 필요합니다. 다시 로그인한 뒤 시도해 주세요.';
  }
  if (errorCode === 'db_upsert_failed') {
    return '구독 정보 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
  return errorCode;
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
  if (!isValidVapidPublicKey(VAPID_PUBLIC_KEY)) {
    return { success: false, error: 'vapid_public_key_invalid' };
  }
  if (typeof window !== 'undefined' && !('PushManager' in window)) {
    return { success: false, error: 'push_not_supported' };
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
