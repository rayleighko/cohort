/**
 * User investment profile + Shape C trigger types — shared between
 * `/api/survey` (write), `/api/aurora/chat` + `/api/cron/cohort-shape-c-triggers`
 * (read), and `src/lib/aurora/chat-prompt.ts` (framework coach preamble).
 *
 * Sourced from vault 51 §2.3 (user_investment_profile schema) + vault 53
 * §1.4 (Shape C trigger DSL spec). Algorithmic-output fields
 * (`cluster_b_sub_classification`, `classification_confidence`,
 * `framework_affinity_inferred`, `shape_c_trigger_presets`) are populated
 * by W4 Fri `profile-classifier.ts` — typed here as optional now so the
 * chat prompt builder can consume partial profiles before classifier ships.
 *
 * Naming convention: camelCase in TypeScript, snake_case at the DB column
 * boundary (mapped in api/survey + api/aurora/chat handlers).
 */

export type ExperienceTier =
  | 'entry'
  | 'starter'
  | 'mid'
  | 'sophisticated'
  | 'veteran';

/**
 * 7 framework affinity카테고리 (vault 57 §3 Q5 lock-in). `unsure` triggers
 * the self-discovery branch in Aurora's framework coach decision tree.
 */
export type FrameworkAffinity =
  | 'drukenmiller_macro'
  | 'kim_dante_macro'
  | 'buffett_index'
  | 'dalio_all_weather'
  | 'kostolany_cycle'
  | 'technical_fundamental'
  | 'unsure';

export type TimeHorizon = 'short' | 'mid' | 'long' | 'ultra_long';
export type SplitBuyEnforcement = 'always' | 'mostly' | 'sometimes' | 'never';
export type MacroWatchingFreq = 'heavy' | 'moderate' | 'occasional' | 'light';
export type PlanFormalization = 'structured' | 'loose' | 'mental' | 'none';
export type EmotionalDecisionCount = 'none' | 'few' | 'some' | 'frequent';

export type ClusterBSubClassification =
  | 'B.1.a'
  | 'B.1.b'
  | 'B.1.c'
  | 'self_discovery';

/**
 * Portfolio composition is stored as percentages only — never absolute KRW
 * (PIPA strict, vault 38-brief §5). Keys are free-form (kr_equity / us_equity
 * / bonds / cash / crypto / etc.) but values must sum to ~100.
 */
export type PortfolioCompositionPct = Record<string, number>;

export interface UserInvestmentProfile {
  userId: string;
  experienceTier: ExperienceTier | null;
  frameworkAffinity: FrameworkAffinity[];
  riskTolerance: number | null;
  timeHorizon: TimeHorizon | null;
  portfolioCompositionPct: PortfolioCompositionPct | null;
  splitBuyEnforcement: SplitBuyEnforcement | null;
  macroWatchingFreq: MacroWatchingFreq | null;
  planFormalization: PlanFormalization | null;
  emotionalDecisionCount12m: EmotionalDecisionCount | null;
  /**
   * Free-form open-text — Q9 weakness self-assessment ("I am most likely to
   * fail when ___"). Used by W4 Wed FOMO/panic detection to calibrate
   * sensitivity (e.g., "시장 -5% 하락 시 panic" → -3% early-warn preset).
   */
  weaknessSelfAssessment: string | null;
  paymentWillingnessCeilingKrw: number | null;
  serviceExpectations: string[];
  infoSources: string[];

  clusterBSubClassification: ClusterBSubClassification | null;
  classificationConfidence: number | null;
  frameworkAffinityInferred: FrameworkAffinity[] | null;

  createdAt: string;
  lastUpdatedAt: string;
}

export type TriggerType =
  | 'price_drop'
  | 'macro_composite'
  | 'disclosure'
  | 'composite';

/**
 * Shape C trigger DSL — discriminated-union shape per `triggerType` lands
 * in W4 Mon (`src/lib/trigger/engine.ts`). For now the prompt-builder only
 * needs the surface fields (type / cooldown / fire status) to surface as
 * self-check context, so `conditionParams` stays as an opaque JSONB blob.
 */
export interface ShapeCTrigger {
  id: string;
  userId: string;
  triggerType: TriggerType;
  conditionParams: Record<string, unknown>;
  cooldownHours: number;
  lastFiredAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
