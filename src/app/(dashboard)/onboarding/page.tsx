import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ConsentModal from '@/components/onboarding/ConsentModal';

/**
 * Onboarding — Modal 1 (PIPA consent). Server component: resolves the
 * authenticated user, then renders the consent flow.
 *
 * Route is also middleware-protected; the redirect here is a safety net and
 * provides the user id for the consent write. Full survey (Modals 2-6) is W4.
 */
export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ConsentModal userId={user.id} />;
}
