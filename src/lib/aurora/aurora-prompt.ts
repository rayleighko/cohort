/**
 * Aurora 🕊 narration system prompt builder — server-only, pure function.
 *
 * Day 9 (W2 Day 4) evolution: category-aware multi-category routing.
 *   morning_brief         — Day 7 ship default, zone overview + key driver
 *   single_indicator_focus — focused trajectory on one indicator
 *   score_change          — yesterday-vs-today composite movement narrative
 *   weekly_summary        — 7-day macro trend retrospective
 *
 * The system prompt is a single common block (38 §2.2 register + 14 §14.3
 * CRITICAL SAFETY FILTER + format contract). Per-category framing lives in
 * the user prompt — avoids 4-way drift across system prompts and keeps the
 * 3-gate safety filter behavior unchanged (commit 1d05856).
 *
 * Source-of-truth verbatim adaptation:
 * - 38-brand-architecture-brief §2.2 — Aurora register (차분 / Analytical /
 *   따뜻함 / Patient / Dovish stance signaler).
 * - 14-v1-core-architecture-sketch §14.3 — CRITICAL SAFETY FILTER (Option B).
 * - 42-typography-color-system §6.2 — Korean primary + short English fallback.
 * - 26-spec line 109-122 — 4 category set (macro_overview renamed
 *   morning_brief per Drift #14 / 38 §2.2 brand domain supersession).
 *
 * Strategic Decision 0 Option B — never 추천/권장/비중 X%/지금 매수/timing입니다.
 * 24-seo Page 5 zone-to-narrative bands are inference signal only — never
 * surfaced verbatim (그 copy 자체에 advisory phrasing 포함).
 */
import type {
  MacroComposite,
  MacroIndicator,
} from '@/lib/macro/composite';

export type NarrationCategory =
  | 'morning_brief'
  | 'single_indicator_focus'
  | 'score_change'
  | 'weekly_summary';

export const NARRATION_CATEGORIES: ReadonlyArray<NarrationCategory> = [
  'morning_brief',
  'single_indicator_focus',
  'score_change',
  'weekly_summary',
];

export interface AuroraNarrationInput {
  /** Defaults to 'morning_brief' for Day 7 backward compatibility. */
  category?: NarrationCategory;
  composite: MacroComposite;
  /** Required for `single_indicator_focus` — the focal indicator. */
  indicator?: MacroIndicator;
  /** Required for `score_change` — yesterday's composite to compute delta. */
  yesterday?: MacroComposite;
  /** Required for `weekly_summary` — last 3-14 daily composites (asc). */
  history?: MacroComposite[];
}

const INDICATOR_LABEL_KO: Record<string, string> = {
  KR_US_RATE_SPREAD: '한미 금리차',
  USDKRW: '원/달러 환율',
  VIXCLS: 'VIX 변동성 지수',
  DTWEXBGS: '달러 지수 (DXY)',
  KR_10Y: '한국 국고채 10년',
  DGS10: '미국 국채 10년',
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
  KR_10Y: '%',
  DGS10: '%',
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
- Concise mobile-card fit (~360px line). Per-category sentence count is specified in the user prompt — honor it.
- No markdown, no bullet lists, no bold, no headings, no emojis.
- No directive verb, no advisory framing — always close with 본인 plan reference in companion register.

Register sample (calm-state, dovish zone, morning_brief):
"오늘 cohort. 한국 매크로 composite는 +2.3 (중립–비둘기). 한미 금리차가 오늘 핵심 driver. 본인 plan 페이스 유지해보세요."

If the macro data is degraded (some indicators missing), acknowledge it briefly without alarm and lean toward 본인 plan reference register.`;

function formatIndicatorRow(code: string, latest: number): string {
  const label = INDICATOR_LABEL_KO[code] ?? code;
  const unit = INDICATOR_UNIT[code] ?? '';
  return `- ${label}: ${latest.toFixed(2)}${unit ? ` ${unit}` : ''}`;
}

function compositeSummaryLines(composite: MacroComposite): string {
  const zoneLabel = ZONE_LABEL_KO[composite.zone];
  const keyDriverLabel =
    INDICATOR_LABEL_KO[composite.keyDriver.code] ?? composite.keyDriver.code;
  return `- Score: ${composite.score.toFixed(2)} / ±10
- Zone: ${composite.zone} (${zoneLabel})
- Key driver: ${keyDriverLabel} (기여도 ${composite.keyDriver.contribution.toFixed(2)})
- As-of: ${composite.asOfDate}`;
}

function degradedNoteFor(composite: MacroComposite): string {
  if (!composite.degraded) return '';
  const missingCount = composite.missingIndicators?.length ?? 0;
  return missingCount > 0
    ? `\n주의: ${missingCount}개 지표 fetch 실패로 일부 누락 상태. 본인 plan reference register 우선.`
    : '\n주의: 일부 지표 누락 상태. 본인 plan reference register 우선.';
}

const OPTION_B_TAIL =
  '추천/권장/비중/매수/매도/timing 어휘 금지 (Strategic Decision 0 Option B).';

function buildMorningBriefUser(composite: MacroComposite): string {
  const indicatorLines = composite.indicators
    .map((i) => formatIndicatorRow(i.code, i.latest))
    .join('\n');
  return `[Category: morning_brief]

오늘의 macro composite:
${compositeSummaryLines(composite)}

각 지표 최근값:
${indicatorLines}${degradedNoteFor(composite)}

Aurora morning brief를 위 차분한 관찰 register로 작성해주세요. 2-3개 짧은 한국어 문장, 모바일 카드 fit, 마크다운 금지.
- 1문장: zone observation (예: "오늘 cohort. 한국 매크로 composite는 ...")
- 2문장: key driver in plain Korean
- 3문장 (optional): 본인 plan reference register

${OPTION_B_TAIL}`;
}

function buildSingleIndicatorFocusUser(
  composite: MacroComposite,
  indicator: MacroIndicator,
): string {
  const label = INDICATOR_LABEL_KO[indicator.code] ?? indicator.code;
  const unit = INDICATOR_UNIT[indicator.code] ?? '';
  return `[Category: single_indicator_focus]

집중 분석 지표: ${label}
- Latest: ${indicator.latest.toFixed(2)}${unit ? ` ${unit}` : ''}
- Normalized (−10..+10): ${indicator.normalized.toFixed(2)}
- Weight in composite: ${(indicator.weight * 100).toFixed(0)}%
- Contribution to composite: ${indicator.contribution.toFixed(2)}

오늘의 macro composite 맥락 (참고):
${compositeSummaryLines(composite)}${degradedNoteFor(composite)}

이 지표에 초점을 둔 Aurora 분석을 위 register로 작성해주세요. 2-4개 짧은 한국어 문장, 모바일 카드 fit, 마크다운 금지.
- 1-2문장: 지표 자체의 plain-Korean 해석 (값 + 정규화 위치)
- 1문장: composite 전체에 대한 이 지표의 영향 (기여도)
- 마지막 문장: 본인 plan reference register

${OPTION_B_TAIL}
*특히 주의*: 이 지표가 어디로 갈지 예측하거나, 이 지표만 보고 행동을 권하지 마세요.`;
}

function buildScoreChangeUser(
  composite: MacroComposite,
  yesterday: MacroComposite,
): string {
  const delta = composite.score - yesterday.score;
  const deltaSign = delta > 0 ? '+' : delta < 0 ? '−' : '0';
  const deltaAbs = Math.abs(delta).toFixed(2);
  const zoneChanged = composite.zone !== yesterday.zone;
  const zoneTransition = zoneChanged
    ? `→ zone 전이: ${ZONE_LABEL_KO[yesterday.zone]} → ${ZONE_LABEL_KO[composite.zone]}`
    : `→ zone 동일: ${ZONE_LABEL_KO[composite.zone]}`;
  return `[Category: score_change]

오늘 vs 어제 composite 변화:
- 오늘 score: ${composite.score.toFixed(2)} / ±10
- 어제 score: ${yesterday.score.toFixed(2)} / ±10
- 변화량: ${deltaSign}${deltaAbs}
${zoneTransition}

오늘 key driver: ${INDICATOR_LABEL_KO[composite.keyDriver.code] ?? composite.keyDriver.code} (기여 ${composite.keyDriver.contribution.toFixed(2)})
어제 key driver: ${INDICATOR_LABEL_KO[yesterday.keyDriver.code] ?? yesterday.keyDriver.code} (기여 ${yesterday.keyDriver.contribution.toFixed(2)})${degradedNoteFor(composite)}

score 변화에 초점을 둔 Aurora 관찰을 위 register로 작성해주세요. 2-3개 짧은 한국어 문장, 모바일 카드 fit, 마크다운 금지.
- 1문장: score 변화 plain-Korean 서술 (urgency framing 절대 금지)
- 1문장: 어떤 driver가 변화를 만들었는지 (분석적, 결과론적)
- 마지막 문장: 본인 plan reference register (절대 "지금 행동" 권유 X)

${OPTION_B_TAIL}
*특히 주의*: "지금이 매수 시점" / "지금이 timing입니다" / "비중 늘려보세요" 절대 금지. score 변화는 정보일 뿐 결정 신호가 아닙니다.`;
}

function buildWeeklySummaryUser(
  composite: MacroComposite,
  history: MacroComposite[],
): string {
  const sorted = [...history].sort((a, b) =>
    a.asOfDate.localeCompare(b.asOfDate),
  );
  const window = sorted.slice(-14);
  const oldest = window[0];
  const scoreRange = window.reduce(
    (acc, c) => ({
      min: Math.min(acc.min, c.score),
      max: Math.max(acc.max, c.score),
    }),
    { min: Infinity, max: -Infinity },
  );
  const zoneSet = new Set(window.map((c) => c.zone));
  const historyLines = window
    .map(
      (c) =>
        `- ${c.asOfDate}: score ${c.score.toFixed(2)} (${ZONE_LABEL_KO[c.zone]}), driver ${INDICATOR_LABEL_KO[c.keyDriver.code] ?? c.keyDriver.code}`,
    )
    .join('\n');
  return `[Category: weekly_summary]

최근 ${window.length}일 macro 추이 (${oldest?.asOfDate ?? '–'} → ${composite.asOfDate}):
${historyLines}

요약 통계:
- Score 범위: ${scoreRange.min.toFixed(2)} ~ ${scoreRange.max.toFixed(2)}
- Zone 경험: ${Array.from(zoneSet).map((z) => ZONE_LABEL_KO[z]).join(', ')}
- 오늘 final score: ${composite.score.toFixed(2)} (${ZONE_LABEL_KO[composite.zone]})${degradedNoteFor(composite)}

지난 일주일 macro trend retrospective를 위 register로 작성해주세요. 3-5개 짧은 한국어 문장, 모바일 카드 fit, 마크다운 금지.
- 1-2문장: 일주일 zone/score 흐름 plain-Korean 서술
- 1문장: 가장 영향이 큰 driver 또는 패턴
- 1문장: 본인 plan 페이스 reference register
- 마지막 문장 (optional): 다음 주를 향한 patient 동행 register ("같이 호흡합니다")

${OPTION_B_TAIL}
*특히 주의*: "다음 주는 X 시점" / "주간 trend가 매수 권유" 등 forward-looking advisory 절대 금지. retrospective 정보 + 본인 plan reference register only.`;
}

/**
 * Builds the system + user prompt pair for an Aurora narration of the given
 * category. Validates per-category required fields and throws a descriptive
 * Error if a required field is missing (callers should validate at the
 * route layer to return 400 before reaching here).
 *
 * Backward compatibility: `category` defaults to `'morning_brief'` so any
 * Day 7 call site `buildAuroraNarrationPrompt({ composite })` still works.
 */
export function buildAuroraNarrationPrompt(
  input: AuroraNarrationInput,
): { system: string; user: string } {
  const category = input.category ?? 'morning_brief';

  let user: string;
  switch (category) {
    case 'morning_brief':
      user = buildMorningBriefUser(input.composite);
      break;
    case 'single_indicator_focus': {
      if (!input.indicator) {
        throw new Error(
          "buildAuroraNarrationPrompt: 'indicator' is required for category 'single_indicator_focus'",
        );
      }
      user = buildSingleIndicatorFocusUser(input.composite, input.indicator);
      break;
    }
    case 'score_change': {
      if (!input.yesterday) {
        throw new Error(
          "buildAuroraNarrationPrompt: 'yesterday' is required for category 'score_change'",
        );
      }
      user = buildScoreChangeUser(input.composite, input.yesterday);
      break;
    }
    case 'weekly_summary': {
      if (!input.history || input.history.length < 3) {
        throw new Error(
          "buildAuroraNarrationPrompt: 'history' (≥3 entries) is required for category 'weekly_summary'",
        );
      }
      user = buildWeeklySummaryUser(input.composite, input.history);
      break;
    }
    default: {
      // Exhaustiveness guard — adding a 5th NarrationCategory without
      // a case here is a compile error (instead of silently returning
      // an undefined `user` string).
      const _exhaustive: never = category;
      throw new Error(
        `buildAuroraNarrationPrompt: unknown category ${String(_exhaustive)}`,
      );
    }
  }

  return { system: AURORA_NARRATION_SYSTEM, user };
}
