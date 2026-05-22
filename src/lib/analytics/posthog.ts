/**
 * PostHog analytics — client-side init.
 * No-ops when NEXT_PUBLIC_POSTHOG_KEY is absent.
 *
 * PIPA posture: anonymous only — identify by the PostHog `$device_id`, NEVER
 * by email or any PII. Session recording is OFF in V1 (opt-in considered W4+).
 * The A/B variant is registered as a super-property so every event carries it.
 */
import posthog from 'posthog-js';
import { getAbVariant } from '@/lib/analytics/ab';

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

  if (!key) {
    // Placeholder env — skip init quietly.
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    autocapture: true,
    disable_session_recording: true, // PIPA — no recording in V1
    person_profiles: 'identified_only', // stay anonymous unless explicitly identified
  });

  // A/B variant as a one-time super-property — attached to every client event.
  posthog.register_once({ ab_variant: getAbVariant() });

  initialized = true;
}

export { posthog };
