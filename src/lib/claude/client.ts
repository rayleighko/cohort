/**
 * Claude API client — single shared Anthropic SDK instance.
 * Used by Aurora + Vesper persona surfaces and the safety-filter Layer 2 classifier.
 * TODO(Day 4): wire streaming responses + the /api/mascot route handler.
 */
import Anthropic from '@anthropic-ai/sdk';

/** Default model for Aurora/Vesper persona responses. */
export const COHORT_PERSONA_MODEL = 'claude-sonnet-4-6';

/** Lightweight model for the safety-filter Layer 2 classifier (Day 0 operator decision). */
export const COHORT_CLASSIFIER_MODEL = 'claude-haiku-4-5';

let client: Anthropic | null = null;

/**
 * Lazily constructs the Anthropic client.
 * Throws only when actually invoked without ANTHROPIC_API_KEY — so the app
 * still builds/boots with a placeholder env (key arrives Day 4).
 */
export function getAnthropicClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[Cohort] ANTHROPIC_API_KEY is not set. Add it to .env.local (Day 4 prerequisite).',
    );
  }

  client = new Anthropic({ apiKey });
  return client;
}
