/**
 * Vercel Cron — evaluate-triggers (W4 Tue Shape C)
 *
 * Schedule: * * * * * (every minute via vercel.json)
 * Auth: Authorization: Bearer $CRON_SECRET
 *
 * V1 active:   macro_composite evaluation only
 * V1 deferred: price_drop (needs real price feed), behavioral_event insert, Aurora nudge
 *
 * Vault refs: vault 62 §2, vault 56 D9
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateTrigger } from '@/lib/trigger/engine';
import { getMacroSnapshot } from '@/lib/macro/snapshot';
import type { ShapeCTrigger } from '@/types/trigger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${cronSecret}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // 1. Fetch active triggers (V1: macro_composite only)
  const { data: triggers, error: fetchError } = await supabase
    .from('shape_c_triggers')
    .select('*')
    .eq('is_active', true)
    .in('trigger_type', ['macro_composite']);

  if (fetchError) {
    console.error('[cron/evaluate-triggers] fetch error:', fetchError.message);
    return NextResponse.json({ error: 'db_fetch_failed' }, { status: 500 });
  }

  if (!triggers || triggers.length === 0) {
    return NextResponse.json({ evaluated: 0, fired: 0, skipped: 0 });
  }

  // 2. Get current macro composite score
  let macroCompositeScore: number | undefined;
  try {
    const snapshot = await getMacroSnapshot();
    macroCompositeScore = snapshot.composite.score;
  } catch (err) {
    console.error('[cron/evaluate-triggers] macro snapshot error:', err);
    // Non-fatal: macro_composite triggers will simply not fire this cycle
  }

  // 3. Evaluate each trigger
  const ctx = {
    macroCompositeScore,
    evaluatedAt: now,
  };

  let fired = 0;
  let skipped = 0;
  const firedIds: string[] = [];

  for (const rawTrigger of (triggers as unknown as ShapeCTrigger[])) {
    const result = evaluateTrigger(rawTrigger, ctx);

    if (!result.fired) {
      skipped++;
      continue;
    }

    // 4. Update last_fired_at on fire
    const { error: updateError } = await supabase
      .from('shape_c_triggers')
      .update({ last_fired_at: now.toISOString() })
      .eq('id', rawTrigger.id);

    if (updateError) {
      console.error(
        `[cron/evaluate-triggers] update failed for ${rawTrigger.id}:`,
        updateError.message,
      );
      skipped++;
      continue;
    }

    fired++;
    firedIds.push(rawTrigger.id);

    // V1 deferred: behavioral_event insert + Aurora nudge
  }

  return NextResponse.json({
    evaluated: triggers.length,
    fired,
    skipped,
    firedIds,
  });
}
