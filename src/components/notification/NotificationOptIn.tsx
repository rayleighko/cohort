'use client';

import { useEffect, useState } from 'react';
import {
  formatPushErrorMessage,
  subscribeWebPush,
  unsubscribeWebPush,
} from '@/lib/notification/sw-register';

export type OptInStatus =
  | 'idle'
  | 'requesting'
  | 'subscribed'
  | 'unsubscribed'
  | 'denied'
  | 'error';

export interface NotificationOptInProps {
  initialStatus?: OptInStatus;
  onStatusChange?: (status: OptInStatus, error?: string) => void;
}

export function NotificationOptIn({
  initialStatus = 'idle',
  onStatusChange,
}: NotificationOptInProps) {
  const [status, setStatus] = useState<OptInStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('Notification' in window)
    ) {
      setStatus('error');
      setErrorMessage('browser_not_supported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    navigator.serviceWorker.getRegistration('/').then(async (reg) => {
      if (!reg) {
        setStatus('idle');
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? 'subscribed' : 'idle');
    });
  }, []);

  async function handleSubscribe() {
    setStatus('requesting');
    setErrorMessage(null);

    const result = await subscribeWebPush();
    if (!result.success || !result.subscription) {
      const errCode = result.error ?? 'unknown_error';
      if (errCode.includes('permission_denied')) {
        setStatus('denied');
      } else {
        setStatus('error');
      }
      setErrorMessage(errCode);
      onStatusChange?.('error', errCode);
      return;
    }

    try {
      const res = await fetch('/api/notification/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: result.subscription }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        const errCode = body?.error ?? `http_${res.status}`;
        setStatus('error');
        setErrorMessage(errCode);
        onStatusChange?.('error', errCode);
        return;
      }
      setStatus('subscribed');
      onStatusChange?.('subscribed');
    } catch (err) {
      setStatus('error');
      const msg = (err as Error).message || 'fetch_failed';
      setErrorMessage(msg);
      onStatusChange?.('error', msg);
    }
  }

  async function handleUnsubscribe() {
    setStatus('requesting');
    setErrorMessage(null);

    const result = await unsubscribeWebPush();
    if (!result.success) {
      const errCode = result.error ?? 'unsubscribe_failed';
      setStatus('error');
      setErrorMessage(errCode);
      onStatusChange?.('error', errCode);
      return;
    }
    setStatus('unsubscribed');
    onStatusChange?.('unsubscribed');
  }

  const isSubscribed = status === 'subscribed';
  const isLoading = status === 'requesting';
  const isDenied = status === 'denied';
  const hasError = status === 'error';

  return (
    <div className="rounded-lg border border-cohort-ink-10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="break-keep text-base font-medium text-cohort-ink-90">
            푸시 알림
          </h3>
          <p className="mt-1 break-keep text-sm text-cohort-ink-50">
            {isSubscribed
              ? 'macro 신호와 본인 trigger 발동 시 Aurora/Vesper가 push로 알림드립니다.'
              : isDenied
                ? '브라우저 알림 권한이 차단되어 있습니다. 브라우저 설정에서 알림 권한을 허용한 뒤 다시 시도해주세요.'
                : '브라우저 push 알림을 받으려면 활성화해주세요.'}
          </p>
        </div>
        <button
          type="button"
          onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={isLoading || isDenied}
          className={`min-h-[44px] rounded-md px-4 text-sm font-medium transition-colors ${
            isSubscribed
              ? 'bg-cohort-ink-10 text-cohort-ink-90 hover:bg-cohort-ink-30'
              : 'bg-cohort-primary text-cohort-ivory hover:opacity-90'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label={isSubscribed ? '푸시 알림 해제' : '푸시 알림 활성화'}
        >
          {isLoading ? '처리 중…' : isSubscribed ? '해제' : '활성화'}
        </button>
      </div>
      {hasError && errorMessage && (
        <p className="mt-2 break-keep text-xs text-cohort-danger" role="alert">
          {formatPushErrorMessage(errorMessage)}
        </p>
      )}
    </div>
  );
}
