/**
 * Polar plan config — client-safe (NO Polar SDK import).
 *
 * Separated from client.ts so client components (e.g. SubscriptionPanel)
 * can read plan labels/prices without bundling the server-only Polar SDK.
 * The env-reading helpers are only meaningful server-side but are pure
 * (no SDK), so they live here too.
 */
import type { SubscriptionTier } from '@/types/shapes';

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

/** Resolves the configured Polar product id for a paid plan (server-side). */
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
 * Maps a Polar product id back to a Cohort tier (webhook handler uses this
 * to decide which tier a subscription grants). Falls back to 'pro'.
 */
export function tierForProductId(productId: string): SubscriptionTier {
  if (productId && productId === process.env.POLAR_PRODUCT_ID_PREMIUM) {
    return 'premium';
  }
  return 'pro';
}
