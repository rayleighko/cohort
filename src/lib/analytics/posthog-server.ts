/**
 * PostHog server-side client (posthog-node) — server-only.
 *
 * Used for the reliable, ad-blocker-proof conversion event (`waitlist_submit`).
 * The project key (NEXT_PUBLIC_POSTHOG_KEY, `phc_…`) is client-safe; reused
 * here server-side. `flushAt: 1` sends immediately — required in serverless
 * route handlers. Caller must `await client.shutdown()` after capture.
 */
import { PostHog } from 'posthog-node';

export function getServerPostHog(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });
}
