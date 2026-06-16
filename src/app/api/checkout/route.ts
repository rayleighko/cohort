import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPolarClient } from '@/lib/polar/client';
import { productIdForPlan, type PaidPlan } from '@/lib/polar/plans';

/**
 * Polar checkout session — POST { plan: 'pro' | 'premium' }.
 *
 * Server-side only: requires an authenticated session, creates a Polar
 * checkout linked to the user via `externalCustomerId = auth user id`
 * (so the webhook can map the resulting subscription back to user_profile),
 * and returns the hosted `checkout.url` for the client to redirect to.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let plan: unknown;
  try {
    plan = (await request.json())?.plan;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (plan !== 'pro' && plan !== 'premium') {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  try {
    const polar = getPolarClient();
    const checkout = await polar.checkouts.create({
      products: [productIdForPlan(plan as PaidPlan)],
      // Links the Polar customer to our auth user — webhook reads this back.
      externalCustomerId: user.id,
      customerEmail: user.email,
      successUrl: `${origin}/settings?checkout=success`,
      metadata: { user_id: user.id, plan },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    // Includes the placeholder-env case (no POLAR_ACCESS_TOKEN yet).
    console.error('[Cohort] Polar checkout creation failed', err);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 });
  }
}
