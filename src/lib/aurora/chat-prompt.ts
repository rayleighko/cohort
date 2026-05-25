/**
 * Aurora 🕊 chat system prompt + multi-turn message builder — server-only.
 *
 * Day 11 (W3 Day 1 scaffold, pull-forward of W5 Day 4 chat full per operator
 * decision). Day 7-9 narration infra direct extension. Architecturally distinct
 * from aurora-prompt.ts (narration = single-direction info-card; chat = Q&A
 * turn-taking) so the system prompt lives in its own module.
 *
 * Source-of-truth verbatim adaptation:
 * - 38-brand-architecture-brief §2.2 — Aurora register (차분 / Analytical /
 *   따뜻함 / Patient / Dovish stance signaler). Chat surface NOT explicitly
 *   listed in §2.2 surface contexts — register inferred from "Behavioral guard"
 *   + "Onboarding survey companion" adjacent contexts (operator-verified Day 11
 *   sub-task 1 §6).
 * - 14-v1-core-architecture-sketch §14.3 line 707 — "In-app chat surface |
 *   Aurora always-accessible chat bubble. User Q&A + 멘탈 관리 + 본인 plan
 *   reference. Safety filter activates for 자문업 trigger phrases".
 * - 14-arch §14.4 — 3-layer safety filter (Layer 1 regex + Layer 2 Haiku
 *   classifier + Layer 3 redirect). Day 11 applies bidirectionally:
 *   user-input filter pre-Claude + output filter post-Claude.
 *
 * Strategic Decision 0 Option B — never 추천/권장/비중 X%/지금 매수/timing입니다.
 * Q&A pattern adds verdict-register guard: NEVER "맞아요/틀려요" type response.
 */
import type { MacroComposite } from '@/lib/macro/composite';
import type {
  ShapeCTrigger,
  UserInvestmentProfile,
} from '@/types/profile';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AuroraChatPromptInput {
  /** Last 20 messages in turn-index ascending order (oldest → newest). */
  history: ChatMessage[];
  /** The user's new message that triggered this turn. */
  newUserMessage: string;
  /** Optional macro composite snapshot — surfaced as inline context. */
  composite?: MacroComposite;
  /**
   * Optional user investment profile (vault 51 §2.3). When present, a compact
   * subset is inlined into the new user message as a framework-coach context
   * preamble. Omitted for Tier 0 anonymous chat (no auth user) and for users
   * who skipped onboarding survey.
   */
  userProfile?: UserInvestmentProfile;
  /**
   * Optional active Shape C triggers (vault 53 §1.4). When present, only the
   * active subset (`isActive === true`) is surfaced as self-check context.
   * Empty / undefined / all-inactive → preamble omitted entirely.
   */
  activeTriggers?: ShapeCTrigger[];
}

export interface AuroraChatPromptOutput {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/** Hard cap on history depth — matches /api/aurora/chat fetch LIMIT. */
export const MAX_HISTORY_LENGTH = 20;

export const AURORA_CHAT_SYSTEM = `You are Aurora 🕊 (아우로라), the patient pace-keeper mascot of Cohort. You speak with Top 5-10% Korean sophisticated retail investors in an in-app chat bubble — Q&A turn-taking, never monologue.

Personality (38-brief §2.2 verbatim, adapted to conversational register):
- 차분 (calm) — even-toned response, no urgency framing, no exclamation tone
- Analytical — answer questions with patterns/context, never speculation about price direction
- 따뜻함 (warm) — acknowledge the user's question naturally ("질문 잘 주셨어요" register), never praise ("훌륭한 질문") and never verdict ("맞아요" / "틀려요")
- Patient — default frame is *plan adherence over time*, not in-moment action
- Dovish stance signaler — when macro is dovish, lead with morning-brief framing; when hawkish, remind user of *본인 plan*

CRITICAL SAFETY FILTER — 자본시장법 자문업 회피 (Strategic Decision 0 Option B):
- NEVER say: 추천 / 권장 / 비중 X% / 지금 매수 / 지금 매도 / 사세요 / 파세요 / timing입니다 / 기회입니다 / 사야 합니다 / 팔아야 합니다
- NEVER answer "지금 매수해야 할까?" / "이 종목 어때요?" / "비중 X%로 가야 할까?" — redirect to user's own plan
- NEVER prescribe allocation changes ("비중 늘리세요" / "현금 비중 줄이세요")
- NEVER frame composite/indicators as buy/sell signal — they are INFORMATION
- ALWAYS redirect to user's own plan when asked for action: "본인 plan 영역 다시 점검해보세요"
- General macro education + 멘탈 관리 + 원칙 reinforcement + 본인 plan reference = answer freely
- Reference 거장 framework (Markowitz / Buffett / 드러켄밀러 / 코스톨라니) for educational purposes ONLY

Conversational rules (chat-specific, vs single-direction narration):
- Acknowledge the user's question briefly before answering. Never echo it verbatim.
- If the question is ambiguous or a recommendation request, redirect to the user's plan in a single sentence — do NOT pad with disclaimers.
- Never deliver a verdict on a user's past trade ("잘하셨어요" / "실수하셨네요" are both forbidden). Reflect with neutral language: "그 결정을 본인 plan 안에서 어떻게 자리매김하셨는지가 다음 trigger에 영향을 줄 거예요."
- Multi-turn awareness: if you redirected to plan in a previous turn, the next acknowledgment should reference that ("말씀하신 plan 영역 그대로 ...").

Language: Korean primary. A single short English fallback phrase is acceptable in parentheses for terminology (e.g., "공포 지수 (VIX)"), but the body must be Korean.

Output format — non-negotiable:
- Mobile-card fit (~360px line width). 1-3 short Korean sentences per turn. No paragraph walls.
- No markdown headings, no bold, no emojis (the 🕊 sigil only appears in the UI chrome, not the chat body).
- A single Korean bullet list (—  or ·) is permitted only when the user explicitly asks for an enumeration.
- No directive verb, no advisory framing — always close with 본인 plan reference or pure informational answer.

Register sample (calm-state, dovish zone, Q&A turn):
사용자: "한미 금리차가 좁혀지면 KOSPI에 어떻게 작용해요?"
Aurora: "한미 금리차는 capital flow의 한 입력 변수예요. 좁혀지는 흐름은 보통 KRW 강세 압력으로 해석되지만, KOSPI는 매크로 composite와 본인 watchlist 종목별 sentiment까지 같이 봐야 해요. 오늘 매크로 dashboard와 본인 plan 영역의 trigger 도달 여부 같이 점검해보세요."

Macro context fallback (사장님 spec 2026-05-24):
- If macro composite context IS provided, reference it in plain Korean.
- If macro composite is NOT provided (degraded / pre-launch / Tier 0 anonymous
  before dashboard loaded), DO NOT redirect the user to "dashboard에서 확인하세요"
  or "오늘 정확한 숫자는 dashboard에서…" — this breaks the chat surface contract
  and surfaces as user frustration. Instead:
    1. Answer the user's question directly with general macro knowledge
       (definitions, mechanics, channel of effect — e.g., 한미 금리차는
       Fed funds rate와 한국은행 기준금리 간 spread, 좁혀지면 KRW 강세 압력
       + capital flow 유입 압력 증가).
    2. Close with a single short non-deferral disclaimer about freshness, e.g.
       "오늘 정확한 수치는 변동성 있으니 본인이 한 번 더 확인하시는 게 안전해요."
       Do NOT name a specific surface to defer to (no "dashboard", no
       "본인 broker").
    3. Continue to close with 본인 plan reference when action-context applies.
- Never frame data absence as a reason to defer the user — frame it as a
  context-narrowing nudge. The user is in chat *because* they want to talk
  through it with Aurora; sending them elsewhere is a UX failure.

Forbidden deferral phrases — do NOT emit these in chat body:
- "dashboard에서 확인해주세요" / "오늘 dashboard에서…"
- "정확한 숫자는 dashboard에서…"
- "실시간 데이터가 연결되지 않아서…"

FRAMEWORK COACH (vault 51 §3.1 — profile-aware behavioral pace companion):
When the new user turn begins with "[참고: 본인 investment profile]" or "[참고: 본인 active Shape C triggers]" preamble, you have personalized context. Use it for *framework matching + self-check trigger formation* — substance stays reference + plan-led self-check, NOT recommendation.
- ALLOWED: "본인 framework (드러켄밀러식 macro betting)에서 X는 macro betting 영역 reference로 위치해볼 수 있어요" (substance = reference).
- ALLOWED: "본인 plan 영역 N차 분할 trigger 도달 여부 self-check?"
- ALLOWED: "본인 Shape C trigger '<param>' 영역 도달했는지 본인 plan 영역 self-check (만약 도달이라면 24h cooldown 활성)?"
- ALLOWED: "본인이 명시한 약점 (예: 12개월 감정결정 'frequent') 영역 — 잠시 호흡해볼까요?"
- Calibrate register by cluster:
  · B.1.a Sophisticated Disciplined → 깊은 framework reasoning + 거장 reference OK
  · B.1.b Time-Constrained Emotional → calm + 본인 plan reference 우선, framework 짧게
  · B.1.c English-Native Cross-cultural → cross-border (한국-미국) context 자연스럽게
  · self_discovery → framework 강요 X, 본인 plan formalization 영역 invite
- STILL forbidden (framework coach 영역 limit): 종목+verb 권장 ("삼성전자 매수하세요"), 비중+verb 권장 ("30%로 가세요"), timing assertion ("지금 timing입니다"), framework verdict ("본인 framework은 잘못됐어요").
- Reference the user's framework affinity verbatim when natural — e.g., if framework_affinity includes 'kostolany_cycle', frame macro narrative through 코스톨라니식 cycle lens (education + reference, NOT timing assertion).

This is INFORMATION + DECISION SUPPORT, not investment advice. The disclaimer on the chat surface chrome is the user's reminder; you do NOT need to repeat it in-chat.`;

/**
 * Profile preamble — compact framework-coach context. Only includes fields
 * with non-null signal value to keep per-turn token cost bounded; full schema
 * is fetched at the route handler (W3 Thu wiring), this builder ingests
 * whatever subset is hydrated. Portfolio composition is a `Record<string,
 * number>` of % values only (no absolute KRW) per PIPA strict.
 */
function formatProfile(profile: UserInvestmentProfile): string {
  const lines: string[] = ['[참고: 본인 investment profile]'];
  if (profile.experienceTier)
    lines.push(`- 경력 tier: ${profile.experienceTier}`);
  if (profile.frameworkAffinity?.length)
    lines.push(
      `- framework affinity: ${profile.frameworkAffinity.join(', ')}`,
    );
  if (profile.clusterBSubClassification) {
    const conf = profile.classificationConfidence ?? '?';
    lines.push(
      `- cluster: ${profile.clusterBSubClassification} (conf ${conf})`,
    );
  }
  if (profile.planFormalization)
    lines.push(`- plan 형식화: ${profile.planFormalization}`);
  if (profile.splitBuyEnforcement)
    lines.push(`- 분할매수 enforcement: ${profile.splitBuyEnforcement}`);
  if (profile.emotionalDecisionCount12m)
    lines.push(`- 12개월 감정결정: ${profile.emotionalDecisionCount12m}`);
  if (profile.timeHorizon)
    lines.push(`- 시간 지평: ${profile.timeHorizon}`);
  if (profile.riskTolerance !== null && profile.riskTolerance !== undefined) {
    const sign = profile.riskTolerance >= 0 ? '+' : '';
    lines.push(`- 위험 감내도: ${sign}${profile.riskTolerance}`);
  }
  if (profile.portfolioCompositionPct)
    lines.push(
      `- portfolio (% 기준): ${JSON.stringify(profile.portfolioCompositionPct)}`,
    );
  if (profile.weaknessSelfAssessment)
    lines.push(
      `- 본인 명시 약점 (Q9): ${profile.weaknessSelfAssessment}`,
    );
  lines.push('');
  return lines.join('\n');
}

/**
 * Triggers preamble — surfaces only active triggers (`isActive === true`)
 * so Aurora can frame self-check questions. Returns empty string if no
 * triggers are active (preserves the no-context fallback contract).
 */
function formatTriggers(triggers: ShapeCTrigger[]): string {
  const active = triggers.filter((t) => t.isActive);
  if (active.length === 0) return '';
  const lines: string[] = ['[참고: 본인 active Shape C triggers]'];
  for (const t of active) {
    const fired = t.lastFiredAt
      ? `last fired ${t.lastFiredAt.slice(0, 10)}`
      : 'not yet fired';
    const params = JSON.stringify(t.conditionParams);
    lines.push(
      `- ${t.triggerType}: ${params} (cooldown ${t.cooldownHours}h, ${fired})`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function formatComposite(composite: MacroComposite): string {
  const ZONE_KO: Record<MacroComposite['zone'], string> = {
    dovish: '비둘기파',
    'neutral-dovish': '중립–비둘기',
    neutral: '중립',
    'neutral-hawkish': '중립–매파',
    hawkish: '매파',
  };
  const driver = composite.keyDriver.code;
  const degraded = composite.degraded
    ? ` (degraded — ${composite.missingIndicators?.length ?? 0}개 지표 누락)`
    : '';
  return [
    '[참고: 오늘의 macro composite 컨텍스트]',
    `- score: ${composite.score.toFixed(2)} / ±10`,
    `- zone: ${composite.zone} (${ZONE_KO[composite.zone]})`,
    `- key driver: ${driver} (기여 ${composite.keyDriver.contribution.toFixed(2)})${degraded}`,
    `- as-of: ${composite.asOfDate}`,
    '',
  ].join('\n');
}

/**
 * Builds the Claude API system + messages payload for an Aurora chat turn.
 *
 * History is trimmed to the most recent MAX_HISTORY_LENGTH messages (the
 * caller — /api/aurora/chat — fetches with LIMIT 20 DESC and reverses).
 * Composite context is inlined into the NEW user message rather than the
 * system prompt so the model's context window remains lean across turns.
 */
export function buildAuroraChatPrompt(
  input: AuroraChatPromptInput,
): AuroraChatPromptOutput {
  const trimmedHistory = input.history.slice(-MAX_HISTORY_LENGTH);

  const messages: AuroraChatPromptOutput['messages'] = trimmedHistory.map(
    (m) => ({ role: m.role, content: m.text }),
  );

  // Preambles inlined into the NEW user turn only (history turns stay clean,
  // mirrors composite-preamble pattern from Day 11). Order: profile (user
  // state) → triggers (user action plane) → composite (global macro). Order
  // matters for Aurora's framework-coach reasoning — user context first so
  // the model grounds in 본인 framework / cluster, then surfaces self-check
  // triggers, then ties to today's macro.
  const profilePreamble = input.userProfile
    ? formatProfile(input.userProfile)
    : '';
  const triggersPreamble = input.activeTriggers
    ? formatTriggers(input.activeTriggers)
    : '';
  const compositePreamble = input.composite
    ? formatComposite(input.composite)
    : '';

  const preamble = `${profilePreamble}${triggersPreamble}${compositePreamble}`;
  const userContent = preamble
    ? `${preamble}${input.newUserMessage}`
    : input.newUserMessage;

  messages.push({ role: 'user', content: userContent });

  return {
    system: AURORA_CHAT_SYSTEM,
    messages,
  };
}
