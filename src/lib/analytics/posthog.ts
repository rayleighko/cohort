/**
 * PostHog analytics — client-side init.
 * No-ops when NEXT_PUBLIC_POSTHOG_KEY is absent, so the app runs with a
 * placeholder env until the operator provides the production key.
 */
import posthog from 'posthog-js';

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

  if (!key) {
    // Placeholder env (Day 1) — skip init quietly.
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    person_profiles: 'identified_only',
  });
  initialized = true;
}

export { posthog };
