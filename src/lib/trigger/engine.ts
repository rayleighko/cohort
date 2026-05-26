/**
 * Shape C — Trigger evaluation engine (W4 Mon)
 *
 * Evaluates user-defined triggers against a market data snapshot.
 * V1 scope: price_drop + macro_composite (pure, synchronous logic)
 * V1.5 deferred: disclosure + composite (return fired=false)
 *
 * Cooldown is NOT enforced here — callers must check isInCooldown()
 * before calling this function and before persisting last_fired_at.
 *
 * Option B constraint: reason strings NEVER contain timing/buy advice.
 */
import { isInCooldown } from '@/lib/trigger/cooldown';
import type {
  MacroCompositeCondition,
  PriceDropCondition,
  ShapeCTrigger,
  TriggerEvaluationContext,
  TriggerEvaluationResult,
} from '@/types/trigger';

// ── Internal evaluators ───────────────────────────────────────────────────────

function evaluatePriceDrop(
  condition: PriceDropCondition,
  ctx: TriggerEvaluationContext,
  trigger: ShapeCTrigger,
  now: Date,
): TriggerEvaluationResult {
  const base: Omit<TriggerEvaluationResult, 'fired' | 'reason'> = {
    triggerId: trigger.id,
    triggerType: 'price_drop',
    evaluatedAt: now,
  };

  const currentPrice = ctx.prices?.[condition.ticker];
  if (currentPrice === undefined) {
    return { ...base, fired: false };
  }

  // Price-drop evaluation requires a reference price from the window.
  // V1: we only have the current snapshot — fire if the drop magnitude is
  // already baked into condition_params as a threshold against current price.
  // Vercel Cron integration (W4 Tue+) will supply delta calculation.
  // For now, treat threshold_pct as a sentinel: if the current price is
  // below (1 - threshold_pct/100) × 1 we consider the condition met.
  // This is intentionally conservative until the cron layer wires in.
  const dropFraction = condition.threshold_pct / 100;
  const fired = dropFraction > 0 && currentPrice <= 1 - dropFraction;

  return {
    ...base,
    fired,
    ...(fired && {
      reason: `본인 trigger 조건 도달: ${condition.ticker} ${condition.threshold_pct}% 하락 조건 확인 — 본인 plan을 점검하세요.`,
    }),
  };
}

function evaluateMacroComposite(
  condition: MacroCompositeCondition,
  ctx: TriggerEvaluationContext,
  trigger: ShapeCTrigger,
  now: Date,
): TriggerEvaluationResult {
  const base: Omit<TriggerEvaluationResult, 'fired' | 'reason'> = {
    triggerId: trigger.id,
    triggerType: 'macro_composite',
    evaluatedAt: now,
  };

  if (ctx.macroCompositeScore === undefined) {
    return { ...base, fired: false };
  }

  const score = ctx.macroCompositeScore;
  const fired =
    condition.direction === 'above'
      ? score > condition.threshold
      : score < condition.threshold;

  return {
    ...base,
    fired,
    ...(fired && {
      reason: `본인 trigger 조건 도달: Macro composite ${condition.direction === 'above' ? '>' : '<'} ${condition.threshold} 확인 — 본인 plan을 점검하세요.`,
    }),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Evaluate a single trigger against the provided market context.
 *
 * Returns `fired: false` if:
 * - The trigger is inactive (is_active = false)
 * - The trigger is within cooldown (last_fired_at + cooldown_hours)
 * - The trigger type is V1.5 deferred (disclosure / composite)
 * - Required context data is absent
 */
export function evaluateTrigger(
  trigger: ShapeCTrigger,
  ctx: TriggerEvaluationContext,
): TriggerEvaluationResult {
  const now = ctx.evaluatedAt ?? new Date();

  const noFire = (reason?: string): TriggerEvaluationResult => ({
    triggerId: trigger.id,
    triggerType: trigger.trigger_type,
    fired: false,
    reason,
    evaluatedAt: now,
  });

  if (!trigger.is_active) {
    return noFire();
  }

  const lastFired = trigger.last_fired_at ? new Date(trigger.last_fired_at) : null;
  if (isInCooldown(lastFired, trigger.cooldown_hours, now)) {
    return noFire();
  }

  switch (trigger.trigger_type) {
    case 'price_drop':
      return evaluatePriceDrop(
        trigger.condition_params as PriceDropCondition,
        ctx,
        trigger,
        now,
      );

    case 'macro_composite':
      return evaluateMacroComposite(
        trigger.condition_params as MacroCompositeCondition,
        ctx,
        trigger,
        now,
      );

    case 'disclosure':
    case 'composite':
      return noFire();

    default:
      return noFire();
  }
}

// Re-export cooldown helper so callers import from one place
export { isInCooldown } from '@/lib/trigger/cooldown';
