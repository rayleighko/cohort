/**
 * POST /api/notification/subscribe
 *
 * Receives a web push subscription from the client and persists it to
 * user_notification_preference. Caller is sw-register.subscribeWebPush().
 *
 * Auth: requires Supabase session (cookie-based, server client).
 *
 * V1: auto opts user into 'web_push' channel on first subscribe. V1.5+ may
 * decouple subscription persistence from channel opt-in (e.g., subscribe
 * silently for SW presence, explicit opt-in later).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubscribeBody {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
    expirationTime?: number | null;
  };
}

function isValidSubscription(
  payload: unknown,
): payload is SubscribeBody['subscription'] {
  if (!payload || typeof payload !== 'object') return false;
  const sub = payload as Record<string, unknown>;
  if (typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) {
    return false;
  }
  const keys = sub.keys as Record<string, unknown> | undefined;
  if (!keys || typeof keys !== 'object') return false;
  if (typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return false;
  return true;
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!isValidSubscription(body.subscription)) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('user_notification_preference')
    .select('channels')
    .eq('user_id', user.id)
    .maybeSingle();

  const existingChannels = (existing?.channels as string[] | undefined) ?? [];
  const channels = existingChannels.includes('web_push')
    ? existingChannels
    : [...existingChannels, 'web_push'];

  const { error: upsertErr } = await admin
    .from('user_notification_preference')
    .upsert(
      {
        user_id: user.id,
        web_push_subscription: body.subscription,
        channels,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (upsertErr) {
    console.error('[notification/subscribe] upsert failed:', upsertErr);
    return NextResponse.json({ error: 'db_upsert_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
