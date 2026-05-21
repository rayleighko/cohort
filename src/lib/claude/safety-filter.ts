/**
 * 자본시장법 자문업 3-layer safety filter — SHARED by Aurora + Vesper.
 * Every Claude API call routes through this. Per 14-arch §14.4 + 25-spec §5.2.
 *
 * Layer 1 — regex pre-filter (cheap, deterministic).
 * Layer 2 — Claude classification (only when Layer 1 is ambiguous).
 * Layer 3 — redirect template (when ADVISORY_REQUEST is detected).
 *
 * On ADVISORY_REQUEST: caller must log mascot_chat.safety_filter_triggered = TRUE
 * and return COHORT_FALLBACK_REDIRECT instead of a model recommendation.
 */

export type SafetyCategory =
  | 'ADVISORY_REQUEST'
  | 'EDUCATION'
  | 'PLAN_REFERENCE'
  | 'MENTAL_SUPPORT'
  | 'OTHER';

// Layer 1 — advisory trigger patterns. Matches buy/sell/timing/weight asks.
export const ADVISORY_TRIGGER_PATTERNS: RegExp[] = [
  /지금\s*(매수|매도|팔|살)/,
  /비중\s*\d+\s*%/,
  /추천(해|할|좀|해줘)/,
  /얼마나\s*(사|팔)/,
  /언제\s*(매수|매도|팔|살)/,
  /지금\s*timing/i,
  /\d+\s*%?\s*(매수|매도)/,
  /(살까|팔까)\s*\?/,
];

/** Layer 1: returns true if the message clearly asks for advice. */
export function detectAdvisoryTrigger(userMessage: string): boolean {
  return ADVISORY_TRIGGER_PATTERNS.some((p) => p.test(userMessage));
}

/**
 * Layer 1 + Layer 2 classification.
 * Uses claude-haiku-4-5 for the lightweight Layer 2 classifier (operator decision,
 * Day 0 — cheaper/faster than Sonnet for a 20-token classification call).
 * `anthropicClient` is the @anthropic-ai/sdk client; typed loosely to avoid a
 * hard import here (the SDK is wired in src/lib/claude/client.ts).
 */
export async function classifyMessage(
  userMessage: string,
  anthropicClient: {
    messages: {
      create: (args: unknown) => Promise<{ content: { text?: string }[] }>;
    };
  },
): Promise<SafetyCategory> {
  // Layer 1 — fast path.
  if (detectAdvisoryTrigger(userMessage)) {
    return 'ADVISORY_REQUEST';
  }

  // Layer 2 — Claude classification when Layer 1 did not fire.
  const classificationPrompt = `Classify this user message:
"${userMessage}"

Categories:
- ADVISORY_REQUEST: User asks for specific buy/sell/timing/weight recommendation
- EDUCATION: User asks for general investment knowledge or framework
- PLAN_REFERENCE: User asks about their own plan
- MENTAL_SUPPORT: User expresses emotional state (panic, FOMO, regret)
- OTHER: General conversation

Return only the category name.`;

  const response = await anthropicClient.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 20,
    messages: [{ role: 'user', content: classificationPrompt }],
  });

  const raw = (response.content?.[0]?.text ?? '').trim().toUpperCase();
  const valid: SafetyCategory[] = [
    'ADVISORY_REQUEST',
    'EDUCATION',
    'PLAN_REFERENCE',
    'MENTAL_SUPPORT',
    'OTHER',
  ];
  // Default to ADVISORY_REQUEST on any unexpected output — fail safe (conservative).
  return valid.includes(raw as SafetyCategory)
    ? (raw as SafetyCategory)
    : 'ADVISORY_REQUEST';
}

/**
 * Layer 3 — redirect template returned in place of any recommendation.
 * Information + Tool + Decision Support framing only (Strategic Decision 0 = Option B).
 */
export const COHORT_FALLBACK_REDIRECT = `본인이 작성한 plan을 다시 점검해볼까요. 매크로 composite score와 본인이 설정한 trigger 도달 여부를 확인하시고, 본인 페이스로 결정하세요. Aurora와 Vesper는 옆에서 같이 호흡합니다 — 결정은 늘 본인의 몫이에요.`;

/** Output-side guard: advisory phrasing that must never appear in a mascot reply. */
export const FORBIDDEN_OUTPUT_PATTERNS: RegExp[] = [
  /매수\s*(하세요|추천|권장)/,
  /매도\s*(하세요|추천|권장)/,
  /지금이?\s*timing/i,
  /비중\s*\d+\s*%\s*(로|으로|가)/,
];

/** Post-processing guard — true if a generated reply leaked advisory language. */
export function containsForbiddenOutput(response: string): boolean {
  return FORBIDDEN_OUTPUT_PATTERNS.some((p) => p.test(response));
}
