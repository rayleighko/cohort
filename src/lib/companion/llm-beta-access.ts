/**
 * LLM Beta access — Pro tier gate PENDING (V2-006).
 *
 * Rule-based companion ($0) is open to all tiers.
 * Claude chat / LLM narration cost API credits → Pro billing tie-in deferred.
 * Until then: env flags only (local operator); no tier enforcement in code.
 */
import { isLlmChatBetaEnabled, isNarrationLlmEnabled } from '@/lib/companion/config';

export type LlmBetaFeature = 'chat' | 'narration';

/**
 * Returns whether the caller may use paid LLM paths.
 * @pending V2-006 — require tier_2_pro when COHORT_* env enabled in production.
 */
export function canUseLlmBeta(_feature: LlmBetaFeature): boolean {
  if (_feature === 'chat') return isLlmChatBetaEnabled();
  return isNarrationLlmEnabled();
}
