import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redactPortfolioCompositionPct } from '@/lib/pipa-redact';

const VALID_FRAMEWORK_VALUES = [
  'druckenmiller_macro_13f',
  'kimdante_macro_korea_us',
  'buffett_index_value',
  'dalio_all_weather',
  'kostolany_psychology_cycle',
  'technical_fundamental',
  'unsure',
] as const;

type SurveyBody = {
  q0_user_stage: 'learning' | 'post_learning_planned' | 'active_investor_enforcement';
  q1_time_horizon?: string;
  q2_portfolio_composition_pct?: Record<string, number>;
  q3_macro_watching_freq?: string;
  q4_info_sources?: string[];
  q5_split_buy_enforcement?: string;
  q6_plan_formalization?: string;
  q7_emotional_decision_count_12m?: string;
  q8_framework_affinity?: string[];
  q9_weakness_self_assessment?: string;
  q10_target_outcome?: string;
  q11_framework_self_described?: string;
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  let body: SurveyBody;

  try {
    body = (await request.json()) as SurveyBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (
    !body.q0_user_stage ||
    !['learning', 'post_learning_planned', 'active_investor_enforcement'].includes(
      body.q0_user_stage,
    )
  ) {
    return NextResponse.json(
      { error: 'invalid_q0_user_stage', detail: 'q0_user_stage must be one of 3 valid values' },
      { status: 400 },
    );
  }

  // vault 62 §2.4 cascade — `user_investment_profile` type 영역 src/types/database.ts 영역
  // generated type 영역 미포함 (0007 migration 영역 db apply 영역 OK 단 types regenerate
  // pending). `as never` cast 영역 Supabase typed API 영역 never-overload 영역 escape hatch.
  // 다음 session 영역 `supabase gen types typescript --project-id <ref> > src/types/database.ts`
  // 영역 run + cast 영역 제거 의무.
  const admin = createAdminClient();

  if (body.q0_user_stage === 'learning') {
    await admin.from('user_investment_profile' as never).upsert({
      user_id: userId,
      user_stage: 'learning',
      user_stage_self_referred_valley: false,
    } as never);
    return NextResponse.json(
      {
        fit: false,
        redirect: 'graceful_exit',
        message:
          'Cohort 영역 fit X. Valley/이효석아카데미/김단테 영역 학습 영역 추천 영역. ' + // OPTION-B-ALLOWED: 학습 리소스 안내 (교육 콘텐츠 — 투자 추천 아님)
          '단 학습 끝난 후 다시 와주세요.',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (body.q2_portfolio_composition_pct) {
    const redacted = redactPortfolioCompositionPct(body.q2_portfolio_composition_pct);
    if (!redacted) {
      return NextResponse.json(
        { error: 'invalid_portfolio_composition', detail: 'portfolio_composition_pct is invalid' },
        { status: 400 },
      );
    }

    for (const [k, v] of Object.entries(body.q2_portfolio_composition_pct)) {
      if (v > 100) {
        return NextResponse.json(
          {
            error: 'pipa_violation_absolute_amount',
            detail: `Field ${k} > 100% (absolute amount not allowed)`,
          },
          { status: 400 },
        );
      }
    }

    const total = Object.values(body.q2_portfolio_composition_pct).reduce((s, n) => s + n, 0);
    if (total < 95 || total > 105) {
      return NextResponse.json(
        { error: 'invalid_portfolio_composition', detail: 'Sum must be 100% ±5' },
        { status: 400 },
      );
    }

    body.q2_portfolio_composition_pct = redacted;
  }

  if (body.q8_framework_affinity) {
    for (const v of body.q8_framework_affinity) {
      if (!VALID_FRAMEWORK_VALUES.includes(v as (typeof VALID_FRAMEWORK_VALUES)[number])) {
        return NextResponse.json(
          { error: 'invalid_framework_affinity', detail: `Invalid value: ${v}` },
          { status: 400 },
        );
      }
    }
  }

  // Cast 정합 (vault 62 §2.4) — `as never` escape hatch (line ~67 정합)
  const { error: upsertError } = await admin.from('user_investment_profile' as never).upsert({
    user_id: userId,
    user_stage: body.q0_user_stage,
    time_horizon: body.q1_time_horizon,
    portfolio_composition_pct: body.q2_portfolio_composition_pct ?? null,
    macro_watching_freq: body.q3_macro_watching_freq,
    info_sources: body.q4_info_sources,
    split_buy_enforcement: body.q5_split_buy_enforcement,
    plan_formalization: body.q6_plan_formalization,
    emotional_decision_count_12m: body.q7_emotional_decision_count_12m,
    framework_affinity: body.q8_framework_affinity,
    weakness_self_assessment: body.q9_weakness_self_assessment,
    framework_self_described: body.q11_framework_self_described,
  } as never);

  if (upsertError) {
    return NextResponse.json(
      { error: 'db_error', detail: upsertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { fit: true, next: 'dashboard_or_onboarding_continue' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
