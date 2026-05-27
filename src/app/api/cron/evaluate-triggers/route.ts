/**
 * Vercel Cron — evaluate-triggers (W4 Tue Shape C)
 *
 * Schedule: * * * * * (every minute via vercel.json)
 * Auth: Authorization: Bearer $CRON_SECRET
 *
 * V1 active:   macro_composite evaluation only
 * V1 active:   Aurora/Vesper nudge dispatched via @/lib/notification/dispatcher (W4 Thu wire-up)
 * V1 deferred: price_drop (needs real price feed)
 * V1 deferred: detectPanic/detectFOMO invocation (caller routing in user-action path)
 *
 * Vault refs: vault 62 §2, vault 56 D9
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateTrigger } from '@/lib/trigger/engine';
import { enforceCooldown } from '@/lib/trigger/cooldown';
import { deriveStance } from '@/lib/trigger/stance';
import { getMacroSnapshot } from '@/lib/macro/snapshot';
import { dispatch } from '@/lib/notification/dispatcher';
import type { Database } from '@/types/database';
import type {
  EnforceCooldownResult,
  ShapeCTrigger,
  ShapeCTriggerRow,
} from '@/types/trigger';

type ShapeCTriggerDbRow = Database['public']['Tables']['shape_c_triggers']['Row'];

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
    const cooldownRow: ShapeCTriggerRow = {
      cooldown_minutes:
        (rawTrigger as ShapeCTrigger & { cooldown_minutes?: number | null })
          .cooldown_minutes ??
        (typeof rawTrigger.cooldown_hours === 'number'
          ? rawTrigger.cooldown_hours * 60
          : null),
      last_fired_at: rawTrigger.last_fired_at,
    };
    const cooldownResult: EnforceCooldownResult = enforceCooldown({
      trigger: cooldownRow,
      now,
    });

    if (!cooldownResult.allowed) {
      console.debug(
        `[cron/evaluate-triggers] cooldown skip for ${rawTrigger.id}: ${cooldownResult.reason}`,
      );
      skipped++;
      continue;
    }

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

    // 5. Persist behavioral_event audit log (non-fatal). Capture the inserted
    //    row so the dispatcher can reference behavioral_event_id downstream.
    const { data: insertedEvent, error: eventInsertError } = await supabase
      .from('behavioral_event')
      .insert({
        user_id: rawTrigger.user_id,
        trigger_id: rawTrigger.id,
        event_type: 'trigger_fired',
        severity: 'info',
        context_jsonb: {
          trigger_type: rawTrigger.trigger_type,
          macro_composite_score: ctx.macroCompositeScore ?? null,
          cooldown_reason: cooldownResult.reason,
          fired_at: now.toISOString(),
        },
      })
      .select()
      .single();

    if (eventInsertError) {
      console.error(
        `[cron/evaluate-triggers] behavioral_event insert failed for ${rawTrigger.id}:`,
        eventInsertError.message,
      );
    }

    // 6. W4 Thu wire-up: dispatch Aurora/Vesper nudge (non-fatal).
    try {
      await dispatch({
        user_id: rawTrigger.user_id,
        trigger: rawTrigger as unknown as ShapeCTriggerDbRow,
        behavioral_event: insertedEvent ?? null,
        category: 'trigger_alert',
        context_jsonb: {
          macro_composite_score: ctx.macroCompositeScore ?? null,
          stance: deriveStance(ctx.macroCompositeScore),
          cooldown_reason: cooldownResult.reason,
          trigger_type: rawTrigger.trigger_type,
        },
      });
    } catch (dispatchErr) {
      console.error(
        `[cron/evaluate-triggers] dispatch failed for trigger ${rawTrigger.id}:`,
        dispatchErr,
      );
    }
  }

  return NextResponse.json({
    evaluated: triggers.length,
    fired,
    skipped,
    firedIds,
  });
}
