/**
 * Survey funnel step metadata — mirrors survey-funnel-posthog-spec.md §2.
 */

export type SurveyStepKind = 'q0' | 'gl_rts' | 'factual';
export type SurveySection = 'qualification' | 'gl_rts' | 'factual';

const FACTUAL_QUESTION_IDS: Record<number, string> = {
  14: 'q1_time_horizon',
  15: 'q2_portfolio_composition',
  16: 'q3_macro_watching_freq',
  17: 'q4_info_sources',
  18: 'q5_split_buy_enforcement',
  19: 'q6_plan_formalization',
  20: 'q7_emotional_decision_count',
  21: 'q8_framework_affinity',
  22: 'q9_weakness_self_assessment',
  23: 'q10_target_outcome',
};

export const SURVEY_LAST_STEP = 23;

export function getSurveyStepMeta(step: number): {
  step_kind: SurveyStepKind;
  question_id: string;
  section: SurveySection;
  progress_pct: number;
} {
  if (step === 0) {
    return {
      step_kind: 'q0',
      question_id: 'q0_user_stage',
      section: 'qualification',
      progress_pct: 0,
    };
  }
  if (step >= 1 && step <= 13) {
    return {
      step_kind: 'gl_rts',
      question_id: `q${step}`,
      section: 'gl_rts',
      progress_pct: Math.round((step / SURVEY_LAST_STEP) * 100),
    };
  }
  return {
    step_kind: 'factual',
    question_id: FACTUAL_QUESTION_IDS[step] ?? `step_${step}`,
    section: 'factual',
    progress_pct: Math.round((step / SURVEY_LAST_STEP) * 100),
  };
}
