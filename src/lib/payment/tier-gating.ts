/**
 * Tier gating — feature access per subscription tier.
 * Tiers: free / trial / pro / premium. V1 shapes A+B+C gate at pro.
 * TODO(Day 3): full feature matrix + server-side enforcement.
 */
import type { SubscriptionTier } from '@/types/shapes';

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  trial: 1,
  pro: 2,
  premium: 3,
};

/** True if `tier` meets or exceeds `required`. */
export function hasAccess(
  tier: SubscriptionTier,
  required: SubscriptionTier,
): boolean {
  return TIER_RANK[tier] >= TIER_RANK[required];
}
