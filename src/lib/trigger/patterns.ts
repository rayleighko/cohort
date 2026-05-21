/**
 * Shape C — panic / FOMO behavioral pattern detection.
 * Detects rapid-action patterns that warrant a soft-pause nudge ("잠시 멈춰볼까요").
 * TODO(W4-W5): implement detection heuristics + nudge dispatch.
 */

export type BehavioralPattern = 'panic' | 'fomo' | 'none';

export function detectBehavioralPattern(): BehavioralPattern {
  // TODO(W4): real detection from recent user actions + price moves.
  return 'none';
}
