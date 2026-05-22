/**
 * Claude API client — single shared Anthropic SDK instance.
 * Used by the Aurora/Vesper persona surfaces and the safety-filter Layer 2
 * classifier. Server-only — ANTHROPIC_API_KEY must never be NEXT_PUBLIC_.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { MascotCharacter } from '@/types/mascot';

/** Persona responses (Aurora / Vesper chat) — Sonnet 4.6. */
export const COHORT_PERSONA_MODEL = 'claude-sonnet-4-6';

/** Safety-filter Layer 2 classifier — Haiku 4.5 (cheap, fast). */
export const COHORT_CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';

let client: Anthropic | null = null;

/**
 * Lazily constructs the Anthropic client. Throws only when invoked without
 * ANTHROPIC_API_KEY, so the app still builds with a placeholder env.
 */
export function getAnthropicClient(): Anthropic {
  const existing = client;
  if (existing) return existing;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[Cohort] ANTHROPIC_API_KEY is not set. Add it to .env.local.',
    );
  }

  const created = new Anthropic({ apiKey });
  client = created;
  return created;
}

/** Extracts plain text from an Anthropic message response. */
function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

/**
 * Calls the Aurora/Vesper persona model (non-streaming) with a fully built
 * system prompt + the user's (PIPA-redacted) message. Returns assistant text.
 *
 * Responses are kept concise + mobile-friendly via a modest max_tokens.
 * `character` is accepted for call-site clarity and diagnostics.
 */
export async function callPersona(
  character: MascotCharacter,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: COHORT_PERSONA_MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    return extractText(message);
  } catch (err) {
    console.error(`[Cohort] callPersona failed (${character})`, err);
    throw err;
  }
}
