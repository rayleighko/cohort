// W4 Thu notification module — WebPushProvider (RFC 8030 / VAPID)
// Refs: vault 38 §2.2/2.3 (voice → push title), vault 62 §2 Q3, RFC 8030

import webpush, { type PushSubscription, type SendResult } from 'web-push';
import type {
  ChannelTarget,
  NotificationChannel,
  NotificationPayload,
  ProviderSendResult,
} from '../types';
import type { NotificationProvider } from './provider';

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:noreply@cohort.co.kr';

let vapidConfigured = false;
function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  return true;
}

export class WebPushProvider implements NotificationProvider {
  readonly channel: NotificationChannel = 'web_push';

  get enabled(): boolean {
    return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
  }

  async send(
    payload: NotificationPayload,
    target: ChannelTarget,
  ): Promise<ProviderSendResult> {
    if (!ensureVapidConfigured()) {
      return {
        success: false,
        error: 'vapid_not_configured',
        retryable: false,
      };
    }

    let subscription: PushSubscription;
    try {
      subscription = JSON.parse(target.provider_token) as PushSubscription;
    } catch {
      return {
        success: false,
        error: 'invalid_subscription_payload',
        retryable: false,
      };
    }

    const title = payload.voice === 'vesper' ? 'Vesper 🦅' : 'Aurora 🕊';
    const body = JSON.stringify({
      title,
      body: payload.body,
      data: {
        category: payload.category,
        deep_link: payload.deep_link ?? null,
        trigger_id: payload.trigger_id ?? null,
        behavioral_event_id: payload.behavioral_event_id ?? null,
      },
    });

    try {
      const result: SendResult = await webpush.sendNotification(
        subscription,
        body,
        {
          TTL: 60 * 60 * 24,
          urgency: payload.priority === 'high' ? 'high' : 'normal',
        },
      );

      return {
        success: true,
        provider_message_id: result.headers?.location ?? undefined,
      };
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      const retryable = ![404, 410, 403].includes(statusCode ?? 0);
      const errBody = (err as { body?: string })?.body;
      const errMessage = (err as Error)?.message;
      return {
        success: false,
        error: errBody ?? errMessage ?? 'unknown_web_push_error',
        retryable,
      };
    }
  }
}
