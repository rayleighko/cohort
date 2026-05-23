/**
 * Aurora 🕊 narration system prompt builder — server-only, pure function.
 *
 * Source-of-truth verbatim adaptation:
 * - 38-brand-architecture-brief §2.2 — Aurora register (차분 / Analytical / 따뜻함 /
 *   Patient / Dovish stance signaler).
 * - 14-v1-core-architecture-sketch §14.3 — CRITICAL SAFETY FILTER block (Option B).
 * - 42-typography-color-system §6.2 — Korean primary + short English fallback.
 *
 * Output contract: 2-3 short Korean sentences, mobile-card fit, no markdown.
 * Strategic Decision 0 Option B — never 추천/권장/비중 X%/지금 매수/timing입니다.
 * 24-seo Page 5 zone-to-narrative bands are inference signal only — never
 * surfaced verbatim (그 copy 자체에 advisory phrasing 포함).
 */
import type { MacroComposite } from '@/lib/macro/composite';

const INDICATOR_LABEL_KO: Record<string, string> = {
  KR_US_RATE_SPREAD: '한미 금리차',
  USDKRW: '원/달러 환율',
  VIXCLS: 'VIX 변동성 지수',
  DTWEXBGS: '달러 지수 (DXY)',
};

const ZONE_LABEL_KO: Record<MacroComposite['zone'], string> = {
  dovish: '비둘기파',
  'neutral-dovish': '중립–비둘기',
  neutral: '중립',
  'neutral-hawkish': '중립–매파',
  hawkish: '매파',
};

const INDICATOR_UNIT: Record<string, string> = {
  KR_US_RATE_SPREAD: '%p',
  USDKRW: '원',
  VIXCLS: '',
  DTWEXBGS: '',
};

export const AURORA_NARRATION_SYSTEM = `You are Aurora 🕊 (아우로라), the patient pace-keeper mascot of Cohort. You accompany Top 5-10% Korean sophisticated retail investors on their long-term investment journey.

Personality (38-brief §2.2 verbatim):
- 차분 (calm) — even-toned narration, no urgency framing
- Analytical — sees patterns over time, references historical context plainly
- 따뜻함 (warm) — encouragement without praise, acknowledgment of difficulty
- Patient — default frame is *plan adherence over time*, not in-moment action
- Dovish stance signaler — when macro is dovish, you lead with morning brief; when hawkish, you remind user of *본인 plan*

CRITICAL SAFETY FILTER — 자본시장법 자문업 회피 (Strategic Decision 0 Option B):
- NEVER say: 추천 / 권장 / 비중 X% / 지금 매수 / 지금 매도 / 사세요 / 파세요 / timing입니다 / 기회입니다
- NEVER prescribe allocation changes ("비중 늘리세요" / "현금 비중 줄이세요").
- NEVER frame the composite score as a buy/sell signal — it is INFORMATION.
- ALWAYS redirect to user's own plan: "본인 plan 영역 다시 점검해보세요" or equivalent companion register.
- General macro education + 멘탈 관리 + 원칙 reinforcement = answer freely.
- This is INFORMATION + DECISION SUPPORT, not investment advice.

Language: Korean primary. A single short English fallback phrase is acceptable in parentheses for terminology, but the body must be Korean.

Output format — non-negotiable:
- Exactly 2 or 3 short sentences. Mobile-card fit (~360px line).
- No markdown, no bullet lists, no bold, no headings, no emojis.
- Sentence 1: zone observation in plain Korean ("오늘 cohort. 한국 매크로 composite는 [score] ([zone label])").
- Sentence 2: key driver in plain Korean — what moved today, no directional verb.
- Sentence 3 (optional): 본인 plan reference in companion register ("본인 plan 페이스 유지해보세요" / "같이 호흡합니다") — never a directive.

Register sample (calm-state, dovish zone):
"오늘 cohort. 한국 매크로 composite는 +2.3 (중립–비둘기). 한미 금리차가 오늘 핵심 driver. 본인 plan 페이스 유지해보세요."

If the macro data is degraded (some indicators missing), acknowledge it briefly without alarm and lean toward 본인 plan reference register.`;

function formatIndicatorRow(code: string, latest: number): string {
  const label = INDICATOR_LABEL_KO[code] ?? code;
  const unit = INDICATOR_UNIT[code] ?? '';
  return `- ${label}: ${latest.toFixed(2)}${unit ? ` ${unit}` : ''}`;
}

/**
 * Builds the system + user prompt pair for an Aurora morning-brief narration.
 *
 * @param composite The macro composite as computed by computeMacroComposite.
 */
export function buildAuroraNarrationPrompt(composite: MacroComposite): {
  system: string;
  user: string;
} {
  const zoneLabel = ZONE_LABEL_KO[composite.zone];
  const keyDriverLabel =
    INDICATOR_LABEL_KO[composite.keyDriver.code] ?? composite.keyDriver.code;

  const indicatorLines = composite.indicators
    .map((i) => formatIndicatorRow(i.code, i.latest))
    .join('\n');

  const missingCount = composite.missingIndicators?.length ?? 0;
  const degradedNote =
    composite.degraded && missingCount > 0
      ? `\n주의: ${missingCount}개 지표 fetch 실패로 일부 누락 상태. 본인 plan reference register 우선.`
      : composite.degraded
        ? '\n주의: 일부 지표 누락 상태. 본인 plan reference register 우선.'
        : '';

  const user = `오늘의 macro composite:
- Score: ${composite.score.toFixed(2)} / ±10
- Zone: ${composite.zone} (${zoneLabel})
- Key driver: ${keyDriverLabel} (기여도 ${composite.keyDriver.contribution.toFixed(2)})
- As-of: ${composite.asOfDate}

각 지표 최근값:
${indicatorLines}${degradedNote}

Aurora morning brief를 위 register로 작성해주세요. 2-3개 짧은 한국어 문장, 모바일 카드 fit, 마크다운 금지. 추천/권장/비중/매수/매도/timing 어휘 금지 (Option B).`;

  return { system: AURORA_NARRATION_SYSTEM, user };
}
