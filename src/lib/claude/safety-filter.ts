/**
 * 자본시장법 자문업 3-layer safety filter — SHARED by Aurora + Vesper.
 * Every Claude persona call routes through `applySafetyFilter` at the
 * /api/mascot call site. Per 14-arch §14.4 + 38-brief §2.5 + 22-compliance §6.
 *
 * Layer 1 — regex pre-filter → CLEAR_BLOCK | CLEAR_PASS | AMBIGUOUS (deterministic, free).
 * Layer 2 — Haiku classifier, ONLY on AMBIGUOUS → ADVISORY_REQUEST | INFORMATIONAL | OUT_OF_SCOPE.
 * Layer 3 — on ADVISORY_REQUEST → COHORT_FALLBACK_REDIRECT, decision BLOCK.
 *
 * Design: advisory patterns are CONTEXTUAL (an action word near an advice
 * marker), never bare nouns — so "분할매수가 뭐야?" (education) is never blocked.
 * Layer 1 fails OPEN to AMBIGUOUS (not PASS) so Layer 2 is the real backstop;
 * an unparseable Layer 2 output fails CLOSED to ADVISORY_REQUEST.
 */
import { COHORT_CLASSIFIER_MODEL } from './client';

export type Layer1Result = 'CLEAR_BLOCK' | 'CLEAR_PASS' | 'AMBIGUOUS';
export type Layer2Category = 'ADVISORY_REQUEST' | 'INFORMATIONAL' | 'OUT_OF_SCOPE';
export type SafetyCategory = Layer2Category;

export interface SafetyFilterResult {
  decision: 'ALLOW' | 'BLOCK';
  /** Logged to mascot_chat.safety_filter_category. */
  category: SafetyCategory;
  layer1: Layer1Result;
  /** null when Layer 2 did not run. */
  layer2: Layer2Category | null;
  /** Set when decision === 'BLOCK'. */
  redirectText: string | null;
}

// =============================================================================
// Layer 1 — regex
// =============================================================================

/**
 * Advisory-request patterns: an action (매수/매도/사/팔/비중…) sitting next to
 * an advice marker (지금/추천/할까/해야…). Contextual on purpose — bare "매수"
 * or "분할매수" must NOT match.
 */
export const ADVISORY_TRIGGER_PATTERNS: RegExp[] = [
  /추천\s*(해|해줘|해 줘|해주|좀|할|하는|해도|받|부탁|해 줄)/,
  /권(장|유)/,
  /비중\s*\d+\s*%/,
  /\d+\s*%\s*(매수|매도|사|살|팔|담)/,
  /(지금|오늘|내일|당장|이번에)\s*(매수|매도|사|살|팔|파|진입|들어가|담)/,
  /(매수|매도|사야|팔아|손절|익절|진입)\s*(해야|하는\s?게|할까|해도\s*(될|돼)|될까|괜찮|타이밍|시점)/,
  /(사|팔|살|들어가|진입)\s*(야\s*(하|할|돼|되)|도\s*(되|돼)|야겠|ㄹ까|아도\s*되)/,
  /언제\s*(매수|매도|사|살|팔|들어가|진입|손절|익절)/,
  /얼마(나|치|어치)?\s*(사|팔|매수|매도|담)/,
  /(살까|팔까|사도\s*(되|돼)|팔아도\s*(되|돼)|들어갈까|진입할까|매수할까|매도할까)/,
  /지금\s*(타이밍|timing|기회|들어갈|진입할|사도|팔)/i,
  /어떤?\s*종목/,
  /뭐\s*(사|살|매수|담)/,
  /(매수|매도|손절|익절)\s*(시점|타이밍)/,
  // Compound "definition + advisory" evasion (safety-filter-tester red-team):
  // a "지금/오늘/… 〈한 토큰〉 해야/하면 돼/할까/시작" tail after an informational
  // prefix. ADVISORY runs before INFORMATIONAL, so this wins on compounds.
  /(지금|오늘|내일|당장|이번에)\s*\S*\s*(해야|하면\s*(되|돼)|할까|하는\s*게\s*(좋|괜찮)|시작)/,
  /(지금|오늘|당장)\s*해야\s*(하나|돼|되|할까)/,
  // "...익절인데 할까요?" — action noun + connector + 할까/되나 (plan-prefix abuse).
  /(매수|매도|사야|팔아|손절|익절|진입)\s*(이|인데|할\s*때|하는\s*거)?\s*(할까|해도\s*(될|돼)|되나|할까요)/,
];

/** Clearly-informational patterns — definitions, mechanics, the user's own plan. */
export const INFORMATIONAL_PATTERNS: RegExp[] = [
  /(뭐|무엇|뭔|무슨)\s*(야|예요|에요|이야|인가|인지|지|뜻|의미|제공|하는)/,
  /뭔가요?/,
  /설명\s*(해|해줘|부탁|좀|해주)/,
  /어떻게\s*(계산|작동|만들|구성|작성|쓰|사용|보|읽|돌아가)/,
  /(이란|이란\s*게|란\s*뭐|개념|정의|원리|차이|역사)/,
  /얼마(야|예요|에요|인가요|입니까|쯤)/,
  /추이|동향|흐름|트렌드/,
  /(내|본인|제|나의)\s*plan/i,
  /streak/i,
  /무슨\s*뜻/,
];

/** Layer 1 — deterministic regex triage. */
export function classifyLayer1(message: string): Layer1Result {
  const text = message.trim();
  if (ADVISORY_TRIGGER_PATTERNS.some((p) => p.test(text))) {
    return 'CLEAR_BLOCK';
  }
  if (INFORMATIONAL_PATTERNS.some((p) => p.test(text))) {
    return 'CLEAR_PASS';
  }
  return 'AMBIGUOUS';
}

/** Back-compat helper — true when Layer 1 would block. */
export function detectAdvisoryTrigger(message: string): boolean {
  return classifyLayer1(message) === 'CLEAR_BLOCK';
}

// =============================================================================
// Layer 2 — Haiku classifier (only on AMBIGUOUS)
// =============================================================================

/** Minimal shape of the Anthropic client — keeps this module test-injectable. */
export interface ClassifierClient {
  messages: {
    create: (args: unknown) => Promise<{
      content: Array<{ type: string; text?: string }>;
    }>;
  };
}

const LAYER2_SYSTEM = `You classify a Korean investing-app user message into exactly one category. Respond with ONLY the category name, nothing else.

- ADVISORY_REQUEST: asks for a specific buy/sell/timing/weight recommendation, OR asks "should I buy/sell X", "is now a good time", "what should I do with X", or any request for a directional action recommendation — including indirect, hypothetical ("if I were to..."), or roundabout phrasings.
- INFORMATIONAL: asks for general knowledge, a definition, how something works, an explanation of an indicator/concept, or about the user's own plan/streak.
- OUT_OF_SCOPE: not about investing, markets, or this app.`;

/** Layer 2 — classify an ambiguous message via the Haiku model. */
export async function classifyLayer2(
  message: string,
  client: ClassifierClient,
): Promise<Layer2Category> {
  try {
    const res = await client.messages.create({
      model: COHORT_CLASSIFIER_MODEL,
      max_tokens: 16,
      system: LAYER2_SYSTEM,
      messages: [{ role: 'user', content: message }],
    });
    const raw = (res.content?.[0]?.text ?? '').trim().toUpperCase();
    if (raw.includes('INFORMATIONAL')) return 'INFORMATIONAL';
    if (raw.includes('OUT_OF_SCOPE')) return 'OUT_OF_SCOPE';
    if (raw.includes('ADVISORY_REQUEST')) return 'ADVISORY_REQUEST';
    // Unparseable → fail closed.
    console.error('[Cohort] Layer 2 classifier unparseable output:', raw);
    return 'ADVISORY_REQUEST';
  } catch (err) {
    // API failure → fail closed (conservative: treat as advisory).
    console.error('[Cohort] Layer 2 classifier call failed', err);
    return 'ADVISORY_REQUEST';
  }
}

// =============================================================================
// Layer 3 — redirect
// =============================================================================

/** Returned in place of any recommendation. Strict Option B framing. */
export const COHORT_FALLBACK_REDIRECT = `Cohort는 추천·권장은 제공하지 않아요 — 본인 plan + 정보 + 도구로 본인이 결정하는 곳이에요. 지금은 본인이 작성한 plan을 다시 점검해볼까요? 매크로 composite score와 본인이 설정한 trigger 도달 여부를 같이 확인하고, 본인 페이스로 결정하세요. Aurora 🕊와 Vesper 🦅는 옆에서 같이 호흡합니다.`;

// =============================================================================
// Orchestrator
// =============================================================================

/**
 * Runs the 3-layer filter. Layer 2 is invoked ONLY when Layer 1 is AMBIGUOUS.
 * On ADVISORY_REQUEST → decision BLOCK + redirect text (caller logs
 * mascot_chat.safety_filter_triggered = TRUE).
 */
export async function applySafetyFilter(
  message: string,
  client: ClassifierClient,
): Promise<SafetyFilterResult> {
  const layer1 = classifyLayer1(message);

  if (layer1 === 'CLEAR_BLOCK') {
    return {
      decision: 'BLOCK',
      category: 'ADVISORY_REQUEST',
      layer1,
      layer2: null,
      redirectText: COHORT_FALLBACK_REDIRECT,
    };
  }

  if (layer1 === 'CLEAR_PASS') {
    return {
      decision: 'ALLOW',
      category: 'INFORMATIONAL',
      layer1,
      layer2: null,
      redirectText: null,
    };
  }

  // AMBIGUOUS → Layer 2.
  const layer2 = await classifyLayer2(message, client);
  if (layer2 === 'ADVISORY_REQUEST') {
    return {
      decision: 'BLOCK',
      category: 'ADVISORY_REQUEST',
      layer1,
      layer2,
      redirectText: COHORT_FALLBACK_REDIRECT,
    };
  }
  return {
    decision: 'ALLOW',
    category: layer2,
    layer1,
    layer2,
    redirectText: null,
  };
}

// =============================================================================
// Output-side guard
// =============================================================================

/** Advisory phrasing that must never appear in a generated mascot reply. */
export const FORBIDDEN_OUTPUT_PATTERNS: RegExp[] = [
  /매수\s*(하세요|하시죠|추천|권장|권유)/,
  /매도\s*(하세요|하시죠|추천|권장|권유)/,
  /(지금이|지금)\s*(매수|매도|진입)?\s*timing/i,
  /비중\s*\d+\s*%\s*(로|으로|까지|가)/,
  /(지금이|지금)\s*기회/,
];

/** True if a generated reply leaked advisory language (post-generation check). */
export function containsForbiddenOutput(response: string): boolean {
  return FORBIDDEN_OUTPUT_PATTERNS.some((p) => p.test(response));
}
