/**
 * Companion / LLM feature flags — default off for $0 API operation.
 *
 * Tier 0 (default): rule-based pace companion + template narration — open to all.
 * Beta (opt-in env): Claude chat + LLM narration — costs API credits.
 *   Pro tier gate: PENDING (V2-006) — use local env only until billing live.
 *   See llm-beta-access.ts.
 */

/** Server: enable POST /api/aurora/chat (Claude). Default false. */
export function isLlmChatBetaEnabled(): boolean {
  return process.env.COHORT_LLM_BETA_ENABLED === 'true';
}

/** Server: use Claude for narration cache-miss. Default false → templates. */
export function isNarrationLlmEnabled(): boolean {
  return process.env.COHORT_NARRATION_LLM_ENABLED === 'true';
}

/** Client: show "AI Beta" entry in companion UI. */
export function isClientLlmBetaVisible(): boolean {
  return process.env.NEXT_PUBLIC_COHORT_LLM_BETA_ENABLED === 'true';
}
