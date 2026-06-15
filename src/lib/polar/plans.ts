/**
 * Polar plan config — client-safe (NO Polar SDK import).
 *
 * Separated from client.ts so client components (e.g. SubscriptionPanel)
 * can read plan labels/prices without bundling the server-only Polar SDK.
 * The env-reading helpers are only meaningful server-side but are pure
 * (no SDK), so they live here too.
 */
import type { SubscriptionTier } from '@/types/shapes';

/**
 * Paid support tiers — USD pricing approximate.
 * No feature differentiation in V1; amounts differ only.
 */
export const POLAR_PLANS = {
  pro: {
    tier: 'pro' as const,
    label: '프로',
    supportLabel: '기본 지원',
    priceUsd: 19,
    blurb: '서버·API 운영비에 기여해 주세요.',
    productEnvVar: 'POLAR_PRODUCT_ID_PRO',
  },
  premium: {
    tier: 'premium' as const,
    label: '프리미엄',
    supportLabel: '넉넉한 지원',
    priceUsd: 59,
    blurb: '학습 프로젝트를 더 오래 이어 가는 데 도움이 됩니다.',
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
