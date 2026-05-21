import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPolarClient } from '@/lib/polar/client';

/**
 * Polar customer portal — POST (no body).
 *
 * Creates a Polar customer session for the authenticated user and returns
 * its `customerPortalUrl`. The portal is Polar's self-serve surface for
 * managing / cancelling the subscription — as MoR, Polar also satisfies the
 * Korean payment-agent mandatory self-cancellation requirement.
 */
export async function POST(_request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const polar = getPolarClient();
    // Resolve the Polar customer by the externalId set at checkout.
    const session = await polar.customerSessions.create({
      externalCustomerId: user.id,
    });
    return NextResponse.json({ url: session.customerPortalUrl });
  } catch (err) {
    console.error('[Cohort] Polar customer session failed', err);
    return NextResponse.json({ error: 'portal_unavailable' }, { status: 502 });
  }
}
