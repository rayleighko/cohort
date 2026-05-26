/**
 * Shape C — Trigger DSL types (W4 Mon)
 *
 * V1 scope: price_drop + macro_composite
 * V1.5 deferred: disclosure + composite
 *
 * Vault refs: vault 62 §2 (trigger spec), vault 56 D9 (behavioral guard)
 * Strategic constraint: Option B — trigger messages NEVER contain timing advice
 */

// ── Trigger type union ────────────────────────────────────────────────────────

/** V1 live evaluation targets */
export type TriggerTypeV1 = 'price_drop' | 'macro_composite';

/** V1.5 deferred — schema accepts them but evaluation returns false */
export type TriggerTypeDeferred = 'disclosure' | 'composite';

export type TriggerType = TriggerTypeV1 | TriggerTypeDeferred;

// ── Condition params per trigger type ─────────────────────────────────────────

/** price_drop: fires when ticker drops ≥ threshold_pct within window_hours */
export interface PriceDropCondition {
  ticker: string;
  threshold_pct: number;
  window_hours: number;
}

/**
 * macro_composite: fires when the cohort macro composite score
 * crosses the boundary in the specified direction
 */
export interface MacroCompositeCondition {
  /** 'above' | 'below' — direction of boundary crossing */
  direction: 'above' | 'below';
  /** composite score threshold (0-100) */
  threshold: number;
}

/** disclosure: V1.5 deferred — placeholder for SEC/DART filing detection */
export interface DisclosureCondition {
  ticker: string;
  disclosure_type?: string;
}

/** composite: V1.5 deferred — AND/OR of multiple sub-conditions */
export interface CompositeCondition {
  operator: 'AND' | 'OR';
  sub_trigger_ids: string[];
}

/** Discriminated union for condition_params JSONB column */
export type TriggerConditionParams =
  | PriceDropCondition
  | MacroCompositeCondition
  | DisclosureCondition
  | CompositeCondition;

// ── DB row mirror ─────────────────────────────────────────────────────────────

/** Mirrors shape_c_triggers table Row — use for runtime type safety */
export interface ShapeCTrigger {
  id: string;
  user_id: string;
  trigger_type: TriggerType;
  condition_params: TriggerConditionParams;
  cooldown_hours: number;
  last_fired_at: string | null;
  is_active: boolean;
  label: string | null;
  created_at: string;
  updated_at: string;
}

/** Insert shape — id/timestamps optional (DB defaults) */
export type ShapeCTriggerInsert = Omit<
  ShapeCTrigger,
  'id' | 'created_at' | 'updated_at' | 'last_fired_at'
> & {
  id?: string;
  last_fired_at?: string | null;
};

/** Update shape — all fields optional except id */
export type ShapeCTriggerUpdate = Partial<
  Omit<ShapeCTrigger, 'id' | 'user_id' | 'created_at'>
>;

// ── Evaluation types ──────────────────────────────────────────────────────────

/** Market data snapshot passed into the evaluation engine per-call */
export interface TriggerEvaluationContext {
  /** Current ticker prices: { [ticker]: price } */
  prices?: Record<string, number>;
  /** Cohort macro composite score snapshot (0-100) */
  macroCompositeScore?: number;
  /** Evaluation timestamp — defaults to Date.now() if omitted */
  evaluatedAt?: Date;
}

export interface TriggerEvaluationResult {
  triggerId: string;
  triggerType: TriggerType;
  fired: boolean;
  /** Human-readable reason for firing — Option B compliant (no timing/buy advice) */
  reason?: string;
  evaluatedAt: Date;
}
