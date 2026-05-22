import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResendClient, WAITLIST_FROM } from '@/lib/email/resend';
import { waitlistConfirmationEmail } from '@/lib/email/templates/waitlist-confirmation';
import { getServerPostHog } from '@/lib/analytics/posthog-server';
import { COHORT_EVENTS } from '@/lib/analytics/events';

/**
 * Waitlist signup — POST { email, consent_pipa, consent_marketing?, ab_variant?, distinct_id? }.
 *
 * Server-side: zod validation (consent_pipa MUST be true), service-role insert
 * into the RLS-default-deny `waitlist` table, idempotent on duplicate email,
 * best-effort Resend confirmation, reliable server-side `waitlist_submit`
 * PostHog event. The email is stored in the DB only — NEVER sent to PostHog.
 */
const bodySchema = z.object({
  email: z.string().email().max(320),
  consent_pipa: z.literal(true), // PIPA — required consent; false ⇒ 400
  consent_marketing: z.boolean().optional().default(false),
  ab_variant: z.enum(['A', 'B', 'C']).optional().default('C'),
  distinct_id: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { email, consent_pipa, consent_marketing, ab_variant, distinct_id } =
    parsed;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const admin = createAdminClient();
    const { error: insertError } = await admin.from('waitlist').insert({
      email: normalizedEmail,
      consent_pipa,
      consent_marketing,
      ab_variant,
    });

    if (insertError) {
      // Unique-violation → already on the list. Idempotent success, no re-send.
      if (insertError.code === '23505') {
        return NextResponse.json({ ok: true, message: 'already_subscribed' });
      }
      throw insertError;
    }

    // Best-effort confirmation email. cohort.co.kr is unverified until W5, so
    // a send failure is expected for non-owner addresses — log, do not fail
    // the request (the user IS on the waitlist).
    try {
      const { subject, html, text } = waitlistConfirmationEmail();
      await getResendClient().emails.send({
        from: WAITLIST_FROM,
        to: normalizedEmail,
        subject,
        html,
        text,
      });
    } catch (emailErr) {
      Sentry.captureException(emailErr, { tags: { area: 'waitlist-email' } });
    }

    // Server-side conversion event — reliable (ad-blocker-proof).
    // Properties carry NO email/PII; distinct_id is the anonymous device id.
    const ph = getServerPostHog();
    if (ph) {
      ph.capture({
        distinctId: distinct_id ?? randomUUID(),
        event: COHORT_EVENTS.WAITLIST_SUBMIT,
        properties: {
          ab_variant,
          has_marketing_consent: consent_marketing,
        },
      });
      await ph.shutdown();
    }

    return NextResponse.json({ ok: true, message: 'subscribed' });
  } catch (err) {
    Sentry.captureException(err, { tags: { area: 'waitlist' } });
    return NextResponse.json({ error: 'unavailable' }, { status: 500 });
  }
}
