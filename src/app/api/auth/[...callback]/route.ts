import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Supabase Auth callback — handles the email-verification link.
 *
 * Exchanges the PKCE `code` for a session, then upserts the user's
 * `user_profile` row (service role — no INSERT RLS policy on that table),
 * then redirects to onboarding.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect') ?? '/onboarding';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  // First-signup profile creation. `created_at` uses the DB default.
  // sub_cluster / consent fields stay NULL/false until W4 onboarding survey.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    await admin
      .from('user_profile')
      .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
