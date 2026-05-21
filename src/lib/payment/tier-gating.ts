/**
 * Tier gating — provider-agnostic. Reads `user_profile` state server-side;
 * never trusts a client-supplied tier. Used by Shape A/B/C route guards
 * and the settings subscription UI.
 *
 * Tiers: free / trial / pro / premium. V1 Shapes A/B/C require pro-level
 * access; an active trial grants pro-level access within its window.
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

interface ProfileTierFields {
  current_tier: string | null;
  trial_ends_at: string | null;
}

/**
 * Resolves the access level a profile currently holds.
 * A `trial` resolves to `pro`-level access while inside the trial window,
 * otherwise to `free`.
 */
export function effectiveTier(p: ProfileTierFields): SubscriptionTier {
  if (p.current_tier === 'premium') return 'premium';
  if (p.current_tier === 'pro') return 'pro';
  if (
    p.current_tier === 'trial' &&
    p.trial_ends_at &&
    new Date(p.trial_ends_at).getTime() > Date.now()
  ) {
    return 'pro';
  }
  return 'free';
}

export interface TierState {
  userId: string;
  rawTier: SubscriptionTier;
  effective: SubscriptionTier;
  trialEndsAt: string | null;
  subscriptionActive: boolean;
  subscriptionRenewalAt: string | null;
}

/**
 * Loads the current user's tier state (server-side).
 * Redirects to /login if unauthenticated, /onboarding if no profile row.
 */
export async function loadTierState(): Promise<TierState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profile')
    .select(
      'current_tier, trial_ends_at, subscription_active, subscription_renewal_at',
    )
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/onboarding');

  return {
    userId: user.id,
    rawTier: (profile.current_tier ?? 'free') as SubscriptionTier,
    effective: effectiveTier(profile),
    trialEndsAt: profile.trial_ends_at,
    subscriptionActive: profile.subscription_active ?? false,
    subscriptionRenewalAt: profile.subscription_renewal_at,
  };
}

/**
 * Server guard — call at the top of a gated page. Redirects insufficient
 * tiers to /settings#upgrade. Returns the tier state on success.
 */
export async function requireTier(
  required: SubscriptionTier,
): Promise<TierState> {
  const state = await loadTierState();
  if (!hasAccess(state.effective, required)) {
    redirect('/settings#upgrade');
  }
  return state;
}
