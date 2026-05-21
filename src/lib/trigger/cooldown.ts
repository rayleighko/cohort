/**
 * Shape C — 24-hour cooldown rule.
 * After a trigger fires, suppress re-fire for `cooldownHours` (default 24)
 * — part of the behavioral-guard soft-pause UX. TODO(W4): wire to trigger_config.
 */

export function isInCooldown(
  lastFiredAt: Date | null,
  cooldownHours = 24,
  now: Date = new Date(),
): boolean {
  if (!lastFiredAt) return false;
  const elapsedMs = now.getTime() - lastFiredAt.getTime();
  return elapsedMs < cooldownHours * 60 * 60 * 1000;
}
