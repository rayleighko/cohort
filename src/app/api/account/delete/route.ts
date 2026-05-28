import { NextResponse, type NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * PIPA 제36조 — 정보주체의 처리정지·삭제 요구권.
 *
 * Cascade order:
 *   1. user_profile + 모든 user_id FK rows (FK ON DELETE CASCADE 의존)
 *   2. auth.users row (admin client)
 *   3. signOut + return 200
 *
 * Cohort tables with user_id FK (verified 0001-0013):
 *   user_profile · onboarding_response · micro_survey_response ·
 *   loi_conversion · shape_c_nudge_log · watchlist · trigger_config ·
 *   mascot_chat · push_subscription · chat_quota_usage ·
 *   user_investment_profile · shape_c_trigger · behavioral_event ·
 *   notification_log · user_notification_preference
 *
 * (aurora_narration_log은 anonymous Tier 0 — user_id 컬럼 없음, 삭제 X 정합)
 */
export async function POST(_request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // 1. user_profile 삭제 (FK ON DELETE CASCADE가 나머지 child rows 정리)
    const { error: profileError } = await admin
      .from('user_profile')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      Sentry.captureException(profileError, {
        tags: { surface: 'pipa_delete', stage: 'user_profile' },
        extra: { userId: user.id },
      });
      return NextResponse.json(
        { error: 'profile_delete_failed', code: profileError.code },
        { status: 500 },
      );
    }

    // 2. auth.users row 삭제 (admin only)
    const { error: authError } = await admin.auth.admin.deleteUser(user.id);
    if (authError) {
      Sentry.captureException(authError, {
        tags: { surface: 'pipa_delete', stage: 'auth_user' },
        extra: { userId: user.id },
      });
      return NextResponse.json(
        { error: 'auth_delete_failed' },
        { status: 500 },
      );
    }

    // 3. 클라이언트 세션도 invalidate
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { surface: 'pipa_delete', stage: 'unexpected' },
    });
    return NextResponse.json({ error: 'unexpected' }, { status: 500 });
  }
}
