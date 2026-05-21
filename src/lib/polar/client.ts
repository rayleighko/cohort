/**
 * Polar SDK client — server-only. Payment provider (MoR, USD billing).
 *
 * Polar is a Merchant of Record: it owns tax/VAT and remits net revenue,
 * which removes the Korean 사업자 prerequisite. Locked 2026-05-21
 * (Lemon Squeezy is the documented fallback).
 *
 * POLAR_ACCESS_TOKEN + POLAR_WEBHOOK_SECRET are server-only secrets —
 * never expose via NEXT_PUBLIC_*. Never import this into a client component
 * (it would bundle the SDK). Client-safe plan config lives in ./plans.
 */
import { Polar } from '@polar-sh/sdk';

/** 'sandbox' until W5 launch, then 'production'. */
export const POLAR_SERVER: 'sandbox' | 'production' =
  process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox';

let client: Polar | null = null;

/**
 * Lazily constructs the Polar client. Throws only when invoked without a
 * token, so the app still builds/boots with placeholder env (Option 2 —
 * live sandbox keys arrive later).
 */
export function getPolarClient(): Polar {
  if (client) return client;

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      '[Cohort] POLAR_ACCESS_TOKEN is not set. Add it to .env.local (sandbox.polar.sh).',
    );
  }

  client = new Polar({ accessToken, server: POLAR_SERVER });
  return client;
}
