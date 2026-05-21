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
} as const;

export type CohortEvent = (typeof COHORT_EVENTS)[keyof typeof COHORT_EVENTS];
