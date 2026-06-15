import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';

/**
 * Onboarding — PIPA consent then unified profile survey.
 * Server component: resolves the authenticated user, then renders the flow.
 */
export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <OnboardingFlow userId={user.id} />;
}
