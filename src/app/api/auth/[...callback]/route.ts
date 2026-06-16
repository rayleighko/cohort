import { NextResponse, type NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
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
    Sentry.captureMessage('auth callback missing code', {
      level: 'warning',
      tags: { surface: 'auth_callback', stage: 'missing_code' },
    });
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    Sentry.captureException(error, {
      tags: { surface: 'auth_callback', stage: 'exchange_code' },
    });
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  // First-signup profile creation. `created_at` uses the DB default.
  // sub_cluster / consent fields stay NULL/false until W4 onboarding survey.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from('user_profile')
      .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
    if (upsertError) {
      Sentry.captureException(upsertError, {
        tags: { surface: 'auth_callback', stage: 'profile_upsert' },
        extra: { userId: user.id, code: upsertError.code },
      });
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
