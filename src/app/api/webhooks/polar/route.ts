import { NextResponse, type NextRequest } from 'next/server';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { createAdminClient } from '@/lib/supabase/admin';
import { tierForProductId } from '@/lib/polar/plans';

// Derive the Subscription payload type from validateEvent's return union
// (avoids depending on an internal SDK import path).
type PolarEvent = ReturnType<typeof validateEvent>;
type PolarSubscription = Extract<
  PolarEvent,
  { type: 'subscription.active' }
>['data'];

/**
 * Polar webhook — POST endpoint.
 *
 * Signature verification is MANDATORY: `validateEvent` checks the
 * Standard Webhooks signature (webhook-id / webhook-timestamp /
 * webhook-signature headers) against POLAR_WEBHOOK_SECRET. An unverified
 * request could forge a tier escalation, so a bad signature → 403.
 *
 * Subscription events drive `user_profile` tier state via the service-role
 * admin client (a webhook has no user session). State sync is last-write-wins
 * idempotent — Polar may retry, and re-applying the current subscription
 * state is harmless.
 */

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.created',
  'subscription.updated',
  'subscription.active',
  'subscription.canceled',
  'subscription.uncanceled',
  'subscription.past_due',
  'subscription.revoked',
]);

async function syncSubscription(
  sub: PolarSubscription,
  eventType: string,
): Promise<void> {
  // The Polar customer was created with externalCustomerId = our auth user id.
  const externalId = sub.customer?.externalId;
  if (!externalId) {
    console.error(
      '[Cohort] subscription webhook missing customer.externalId',
      sub.id,
    );
    return;
  }

  // Grant a paid tier only while the subscription is genuinely live.
  const revoked = eventType === 'subscription.revoked';
  const granting =
    !revoked && (sub.status === 'active' || sub.status === 'trialing');

  const admin = createAdminClient();
  const { error } = await admin
    .from('user_profile')
    .update({
      current_tier: granting ? tierForProductId(sub.productId) : 'free',
      subscription_active: granting,
      polar_customer_id: sub.customerId,
      polar_subscription_id: sub.id,
      subscription_renewal_at: sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', externalId);

  if (error) {
    console.error('[Cohort] failed to sync subscription state', error);
    throw error; // 5xx → Polar retries
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Cohort] POLAR_WEBHOOK_SECRET not set — webhook rejected');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  // Raw body is required for signature verification — read as text.
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event;
  try {
    event = validateEvent(body, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 403 });
    }
    throw err;
  }

  try {
    if (SUBSCRIPTION_EVENTS.has(event.type)) {
      // All subscription.* payloads carry a Subscription as `data`.
      await syncSubscription(event.data as PolarSubscription, event.type);
    }
    // Non-subscription events are acknowledged with 200 (no-op).
  } catch {
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
