/**
 * PostHog event taxonomy — single source of truth for event names.
 * Keeps funnel analysis consistent across landing → signup → onboarding → trial.
 * TODO(Day 5 / W5): expand as the funnel + Shape A/B/C usage events land.
 */

export const COHORT_EVENTS = {
  // Landing + acquisition
  LANDING_VIEW: 'landing_view',
  WAITLIST_SUBMIT: 'waitlist_submit',
  CTA_CLICK: 'cta_click',

  // Auth + onboarding
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  ONBOARDING_COMPLETE: 'onboarding_complete',

  // Trial + subscription
  TRIAL_START: 'trial_start',
  SUBSCRIPTION_START: 'subscription_start',

  // Safety filter (compliance signal)
  SAFETY_FILTER_TRIGGERED: 'safety_filter_triggered',

  // Unified survey funnel (SurveyModal — handoff survey-funnel-posthog-spec.md)
  SURVEY_OPENED: 'survey_opened',
  SURVEY_STEP_VIEWED: 'survey_step_viewed',
  SURVEY_STEP_ADVANCED: 'survey_step_advanced',
  SURVEY_STEP_BACK: 'survey_step_back',
  SURVEY_Q0_LEARNING_EXIT: 'survey_q0_learning_exit',
  SURVEY_GL_RTS_RATIONALE_TOGGLED: 'survey_gl_rts_rationale_toggled',
  SURVEY_GL_RTS_SECTION_COMPLETE: 'survey_gl_rts_section_complete',
  SURVEY_FACTUAL_SECTION_COMPLETE: 'survey_factual_section_complete',
  SURVEY_SUBMIT_SUCCESS: 'survey_submit_success',
  SURVEY_SUBMIT_FAILED: 'survey_submit_failed',
  SURVEY_ABANDONED: 'survey_abandoned',
  SURVEY_COMPLETED: 'survey_completed',
} as const;

export type CohortEvent = (typeof COHORT_EVENTS)[keyof typeof COHORT_EVENTS];
