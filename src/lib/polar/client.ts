/**
 * Polar SDK client — server-only. Payment provider (MoR, USD billing).
 *
 * Polar is a Merchant of Record: it owns tax/VAT and remits net revenue,
 * which removes the Korean 사업자 prerequisite. Locked 2026-05-21
 * (Lemon Squeezy is the documented fallback).
 *
 * POLAR_ACCESS_TOKEN + POLAR_WEBHOOK_SECRET are server-only secrets —
 * never expose via NEXT_PUBLIC_*. Never import this into a client component.
 */
import { Polar } from '@polar-sh/sdk';
import type { SubscriptionTier } from '@/types/shapes';

/** 'sandbox' until W5 launch, then 'production'. */
export const POLAR_SERVER: 'sandbox' | 'production' =
  process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox';

let client: Polar | null = null;

/**
 * Lazily constructs the Polar client. Throws only when invoked without a
 * token, so the app still builds/boots with placeholder env (Option 2 —
 * live sandbox keys arrive later).
 */
export function getPolarClient(): Polar {
  if (client) return client;

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      '[Cohort] POLAR_ACCESS_TOKEN is not set. Add it to .env.local (sandbox.polar.sh).',
    );
  }

  client = new Polar({ accessToken, server: POLAR_SERVER });
  return client;
}

/** Paid plans — USD pricing approximate, finalized before W5 launch. */
export const POLAR_PLANS = {
  pro: {
    tier: 'pro' as const,
    label: 'Pro',
    priceUsd: 19,
    productEnvVar: 'POLAR_PRODUCT_ID_PRO',
  },
  premium: {
    tier: 'premium' as const,
    label: 'Premium',
    priceUsd: 59,
    productEnvVar: 'POLAR_PRODUCT_ID_PREMIUM',
  },
} as const;

export type PaidPlan = keyof typeof POLAR_PLANS;

/** Resolves the configured Polar product id for a paid plan. */
export function productIdForPlan(plan: PaidPlan): string {
  const id = process.env[POLAR_PLANS[plan].productEnvVar];
  if (!id) {
    throw new Error(
      `[Cohort] ${POLAR_PLANS[plan].productEnvVar} is not set. Configure the Polar product.`,
    );
  }
  return id;
}

/**
 * Maps a Polar product id back to a Cohort tier (used by the webhook handler
 * to decide which tier a subscription grants). Falls back to 'pro'.
 */
export function tierForProductId(productId: string): SubscriptionTier {
  if (productId && productId === process.env.POLAR_PRODUCT_ID_PREMIUM) {
    return 'premium';
  }
  return 'pro';
}
