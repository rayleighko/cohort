/**
 * Per-tier Aurora chat quota — vault 62 §1 Q3 lock-in (CEO confirm 2026-05-25).
 *
 * Tier 0 anonymous applies today (V1 chat is unauthenticated). Tier 1+ tiers
 * ship the numbers now so the quota check is uniform once auth + Toss live
 * (W5 Wed cascade). Premium (tier 3) V1 defer (vault 53 §1) — falls through
 * as unlimited until the W5+ subscriptions table lands.
 *
 * The 429 redirect copy is Aurora-style (calm + plan-reference + companion
 * register, cohort-product approved).
 */

export type TierType =
  | 'tier_0'
  | 'tier_1'
  | 'tier_2_pro'
  | 'tier_3_premium';

export const TIER_QUOTAS: Record<
  TierType,
  { daily: number; monthly: number }
> = {
  tier_0: { daily: 5, monthly: 100 },
  tier_1: { daily: 20, monthly: 400 },
  tier_2_pro: { daily: 100, monthly: 2000 },
  tier_3_premium: {
    daily: Number.POSITIVE_INFINITY,
    monthly: Number.POSITIVE_INFINITY,
  },
};

/** Threshold (0..1) at which we emit a `chat_quota_hit` warning event. */
export const QUOTA_WARN_THRESHOLD = 0.8;

export const QUOTA_EXCEEDED_REDIRECT_KO =
  '오늘 quota 도달했어요. 본인 plan 점검 시간이에요. 내일 다시 만나요. 🕊';

/**
 * Resolves user tier from authenticated userId. Anonymous (no userId) →
 * 'tier_0' (V1 chat is anonymous-only — userId stays null until W5 Wed
 * auth wiring + subscriptions table land). Signed-up free → 'tier_1'.
 * Active Pro subscription → 'tier_2_pro' (W5 cascade). Premium V1 defer
 * (vault 53 §1) — falls back to tier_2_pro until W5+.
 */
export async function resolveUserTier(
  userId: string | null,
): Promise<TierType> {
  if (!userId) return 'tier_0';
  // TODO(W5 Wed): query subscriptions table → tier_2_pro for active Pro.
  return 'tier_1';
}

/**
 * Returns tomorrow's KST midnight as an ISO string (quota reset boundary).
 * KST = UTC+9; midnight KST = 15:00 UTC the previous calendar day. Surfaces
 * in the 429 payload so clients can render a precise reset countdown.
 */
export function tomorrowMidnightKstIso(): string {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const tomorrowKstMidnight = new Date(kstNow);
  tomorrowKstMidnight.setUTCDate(kstNow.getUTCDate() + 1);
  tomorrowKstMidnight.setUTCHours(0, 0, 0, 0);
  return new Date(
    tomorrowKstMidnight.getTime() - KST_OFFSET_MS,
  ).toISOString();
}
