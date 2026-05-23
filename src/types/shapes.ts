/**
 * Shape A/B/C domain types.
 * V1 scope: Shape A (Macro Dashboard), Shape B (분할매수 Decision Support),
 * Shape C (Custom Trigger Alert + Behavioral Guard). V2 shapes deferred.
 * TODO(W2-W4): flesh out as each Shape is built.
 */

// --- Shape A — Macro composite ----------------------------------------------
// Shape A macro composite types now live in src/lib/macro/composite.ts
// (MacroComposite + MacroIndicator + MacroZone). The flat MacroScores type
// from W1 §5.3 was superseded in W2 per vault_sot_priority §4.4.

// --- Shape B — 분할매수 decision support ------------------------------------
export interface DecisionScores {
  macro: number;
  technical: number;
  sentiment: number;
  composite: number;
}

// --- Shape C — custom trigger -----------------------------------------------
export type TriggerType = 'price' | 'macro' | 'composite' | 'disclosure';

export interface TriggerConfig {
  id: string;
  name: string;
  type: TriggerType;
  condition: Record<string, unknown>;
  cooldownHours: number;
  active: boolean;
}

export type SubscriptionTier = 'free' | 'trial' | 'pro' | 'premium';
