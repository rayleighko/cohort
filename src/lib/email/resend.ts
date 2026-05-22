/**
 * Resend email client — server-only. RESEND_API_KEY must never be NEXT_PUBLIC_.
 */
import { Resend } from 'resend';

let client: Resend | null = null;

export function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('[Cohort] RESEND_API_KEY is not set.');
  }
  if (!client) client = new Resend(key);
  return client;
}

/**
 * Sender address. cohort.co.kr is not yet verified in Resend (W5 prereq —
 * SPF/DKIM/DMARC), so V1 falls back to Resend's shared `onboarding@resend.dev`.
 * Set RESEND_FROM once the domain is verified.
 */
export const WAITLIST_FROM =
  process.env.RESEND_FROM ?? 'Cohort <onboarding@resend.dev>';
