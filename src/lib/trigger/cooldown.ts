/**
 * Shape C — 24-hour cooldown rule.
 * After a trigger fires, suppress re-fire for `cooldownHours` (default 24)
 * — part of the behavioral-guard soft-pause UX. TODO(W4): wire to trigger_config.
 */

import type { EnforceCooldownResult, ShapeCTriggerRow } from '@/types/trigger';

export function isInCooldown(
  lastFiredAt: Date | null,
  cooldownHours = 24,
  now: Date = new Date(),
): boolean {
  if (!lastFiredAt) return false;
  const elapsedMs = now.getTime() - lastFiredAt.getTime();
  return elapsedMs < cooldownHours * 60 * 60 * 1000;
}

export function enforceCooldown(args: {
  trigger: ShapeCTriggerRow;
  now: Date;
}): EnforceCooldownResult {
  const { trigger, now } = args;

  if (!trigger.cooldown_minutes || trigger.cooldown_minutes <= 0) {
    return {
      allowed: true,
      reason: 'no_cooldown_configured',
      remainingMs: null,
      nextEligibleAt: null,
    };
  }

  if (!trigger.last_fired_at) {
    return {
      allowed: true,
      reason: 'never_fired',
      remainingMs: null,
      nextEligibleAt: null,
    };
  }

  const lastFiredAt = new Date(trigger.last_fired_at);
  const cooldownMs = trigger.cooldown_minutes * 60_000;
  const elapsedMs = now.getTime() - lastFiredAt.getTime();

  if (elapsedMs >= cooldownMs) {
    return {
      allowed: true,
      reason: 'cooldown_expired',
      remainingMs: null,
      nextEligibleAt: null,
    };
  }

  const remainingMs = cooldownMs - elapsedMs;
  const nextEligibleAt = new Date(lastFiredAt.getTime() + cooldownMs);

  return {
    allowed: false,
    reason: 'cooldown_active',
    remainingMs,
    nextEligibleAt,
  };
}
