import { redirect } from 'next/navigation';

import IpsWizardShell from '@/components/ips/IpsWizardShell';
import { draftFromIpsDocument } from '@/lib/ips/build-document';
import { buildPrefillFromProfile, createInitialDraft } from '@/lib/ips/prefill';
import { loadActiveIps } from '@/lib/principle/ips-persistence';
import { createClient } from '@/lib/supabase/server';

/**
 * IPS wizard — logged-in users only.
 * Prefills from active IPS (re-edit) or user_investment_profile survey fields.
 */
export default async function IpsWizardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/settings/ips');
  }

  const [{ data: profile }, activeIps] = await Promise.all([
    supabase
      .from('user_investment_profile')
      .select(
        'time_horizon, portfolio_composition_pct, split_buy_enforcement, plan_formalization',
      )
      .eq('user_id', user.id)
      .maybeSingle(),
    loadActiveIps(supabase, user.id),
  ]);

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

  const initialDraft = activeIps
    ? draftFromIpsDocument(activeIps.document)
    : createInitialDraft(prefill);

  return (
    <IpsWizardShell
      prefill={prefill}
      initialDraft={initialDraft}
      actualAllocationPct={portfolioPct}
      planFormalization={profile?.plan_formalization ?? null}
    />
  );
}
