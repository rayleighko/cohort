import { redirect } from 'next/navigation';

import IpsWizardShell from '@/components/ips/IpsWizardShell';
import { buildPrefillFromProfile } from '@/lib/ips/prefill';
import { createClient } from '@/lib/supabase/server';

/**
 * IPS wizard — logged-in users only.
 * Prefills from user_investment_profile survey fields (Q1/Q2/Q5/Q6).
 * Persist: sessionStorage until V2-004 API (docs/specs/ips-wizard.md).
 */
export default async function IpsWizardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/settings/ips');
  }

  const { data: profile } = await supabase
    .from('user_investment_profile')
    .select(
      'time_horizon, portfolio_composition_pct, split_buy_enforcement, plan_formalization',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const portfolioPct =
    profile?.portfolio_composition_pct &&
    typeof profile.portfolio_composition_pct === 'object' &&
    !Array.isArray(profile.portfolio_composition_pct)
      ? (profile.portfolio_composition_pct as Record<string, number>)
      : null;

  const prefill = buildPrefillFromProfile({
    time_horizon: profile?.time_horizon,
    portfolio_composition_pct: portfolioPct,
    split_buy_enforcement: profile?.split_buy_enforcement,
    plan_formalization: profile?.plan_formalization,
  });

  return (
    <IpsWizardShell
      prefill={prefill}
      actualAllocationPct={portfolioPct}
      planFormalization={profile?.plan_formalization ?? null}
    />
  );
}
