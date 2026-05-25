/**
 * Claude API client — single shared Anthropic SDK instance.
 * Used by the Aurora/Vesper persona surfaces and the safety-filter Layer 2
 * classifier. Server-only — ANTHROPIC_API_KEY must never be NEXT_PUBLIC_.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { MascotCharacter } from '@/types/mascot';
import type { UserInvestmentProfile } from '@/types/profile';

/**
 * Persona model alias — kept as the *deep* default for backward compat with
 * Day 7-11 single-model callsites. New chat-route wiring (W3 Thu) chooses
 * between DEEP (Sonnet) and FAST (Haiku) per `shouldUseSonnet()`.
 */
export const COHORT_PERSONA_MODEL = 'claude-sonnet-4-6';

/** Persona — deep model (Sonnet 4.6) for framework matching + multi-turn reasoning. */
export const COHORT_PERSONA_MODEL_DEEP = COHORT_PERSONA_MODEL;

/** Persona — fast model (Haiku 4.5) for short factual + general info. */
export const COHORT_PERSONA_MODEL_FAST = 'claude-haiku-4-5-20251001';

/** Safety-filter Layer 2 classifier — Haiku 4.5 (cheap, fast). */
export const COHORT_CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Per-turn model routing heuristic (vault 51 §4.4 — Haiku/Sonnet smart routing).
 * Goal: route ~60-70% of queries to Haiku (10× cheaper than Sonnet) without
 * sacrificing framework-coach quality on the queries that actually need it.
 *
 * ADVISORY_REQUEST is short-circuited by the input-side safety filter BEFORE
 * any Claude call, so this heuristic never sees them. Caller is responsible
 * for that ordering (see `/api/aurora/chat/route.ts` Step 1).
 *
 * Returns true → Sonnet (deep). Returns false → Haiku (fast, default).
 *
 * Heuristic signals (any one trips Sonnet):
 *   1. Length > 200 chars (long question implies complexity / multi-clause)
 *   2. Framework-affinity keywords (드러켄밀러 / 김단테 / 버핏 / 달리오 /
 *      코스톨라니 / macro betting / risk parity / all-weather / cycle)
 *   3. Macro deep-dive keywords (한미 금리차 / DXY / VIX / FOMC / Fed /
 *      한국은행 / 기준금리)
 *   4. Behavioral / emotional signals (panic / FOMO / 무서 / 두려 / 충동 /
 *      후회 / 욕심) — behavioral nudge needs Sonnet's nuance
 *   5. Framework reasoning request (framework / 분석 / reasoning / reference /
 *      위치 / 어떻게 봐)
 *   6. UserProfile provided AND framework_affinity is non-empty + non-unsure
 *      → user is in framework-coach mode, Sonnet improves reasoning quality
 */
const FRAMEWORK_RE =
  /(드러켄밀러|김단테|버핏|달리오|코스톨라니|macro betting|risk parity|all-weather|all weather|cycle 분석)/i;
const MACRO_RE =
  /(한미 금리차|DXY|VIX|DTWEXBGS|USDKRW|FOMC|Fed|연준|한국은행|기준금리|capital flow|inflation)/i;
const BEHAVIORAL_RE =
  /(panic|FOMO|패닉|무서|두려|충동|후회|욕심|불안|초조|손절|존버)/i;
const REASONING_RE =
  /(framework|분석|reasoning|reference|위치|어떻게 봐|어떻게 보|어떻게 해석|어떻게 reasoning|self-check)/i;

export function shouldUseSonnet(
  userMessage: string,
  userProfile?: Pick<
    UserInvestmentProfile,
    'frameworkAffinity'
  > | null,
): boolean {
  const msg = userMessage ?? '';
  if (msg.length > 200) return true;
  if (FRAMEWORK_RE.test(msg)) return true;
  if (MACRO_RE.test(msg)) return true;
  if (BEHAVIORAL_RE.test(msg)) return true;
  if (REASONING_RE.test(msg)) return true;
  if (
    userProfile?.frameworkAffinity?.some(
      (a) => a && a !== 'unsure',
    )
  ) {
    return true;
  }
  return false;
}

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

/** Multi-turn message payload. Aurora chat surface (Day 11+) consumer. */
export type PersonaTurn = { role: 'user' | 'assistant'; content: string };

/**
 * Multi-turn variant of `callPersona` — accepts a pre-built messages array
 * (system + history + new user turn) for chat surfaces where the prompt
 * builder has already shaped the conversation. Day 11 introduces this for
 * Aurora chat (W3 Day 1 scaffold).
 *
 * W3 Thu — optional `model` parameter (defaults to Sonnet for backward
 * compat with pre-W3-Thu callers). Chat route handler computes the model
 * via `shouldUseSonnet()` and forwards it here.
 */
export async function callPersonaMultiTurn(
  character: MascotCharacter,
  systemPrompt: string,
  messages: PersonaTurn[],
  model: string = COHORT_PERSONA_MODEL_DEEP,
): Promise<string> {
  try {
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model,
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });
    return extractText(message);
  } catch (err) {
    console.error(
      `[Cohort] callPersonaMultiTurn failed (${character}, model=${model})`,
      err,
    );
    throw err;
  }
}
