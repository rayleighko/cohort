---
name: aurora-narration-4-category-routing
description: Day 9 architectural decision — single shared AURORA_NARRATION_SYSTEM + per-category user prompt branching (NOT 4 separate system prompts). Exhaustive switch never guard.
metadata:
  type: project
  created_at: 2026-05-23
  source_commit: a44a4b2
  cross_ref: dual-mascot-safety-filter + aurora-narration-assistant-mode-safety-filter-limit
---

Day 9 (W2 Day 4) Aurora narration 4-category routing ship 시 architectural 결정 영구 기록.

## Architectural decision — Single shared system prompt + per-category user prompt branching

`src/lib/aurora/aurora-prompt.ts` (commit a44a4b2 +200 LOC):
- **단일 `AURORA_NARRATION_SYSTEM`** — 38 §2.2 Aurora register + Option B safety + 공통 2-3 sentence format guideline + 4 category awareness
- **4 per-category user-prompt builders** — `buildMorningBriefUser` / `buildSingleIndicatorFocusUser` / `buildScoreChangeUser` / `buildWeeklySummaryUser`
- **Exhaustive switch with `never` guard** — TypeScript compiler가 future 5th category 추가 시 빠진 case 자동 catch
- **Throws on missing required fields** — per-category required (e.g., single_indicator_focus needs indicator, score_change needs yesterday, weekly_summary needs history[7])

```typescript
export type NarrationCategory =
  | 'morning_brief'
  | 'single_indicator_focus'
  | 'score_change'
  | 'weekly_summary';

export function buildAuroraNarrationPrompt(
  input: AuroraNarrationInput,
): { system: string; user: string } {
  const category = input.category ?? 'morning_brief'; // Day 7 backward compat
  let user: string;
  switch (category) {
    case 'morning_brief':
      user = buildMorningBriefUser(input.composite);
      break;
    case 'single_indicator_focus':
      if (!input.indicator) throw new Error('single_indicator_focus requires indicator');
      user = buildSingleIndicatorFocusUser(input.composite, input.indicator);
      break;
    case 'score_change':
      if (!input.yesterday) throw new Error('score_change requires yesterday');
      user = buildScoreChangeUser(input.composite, input.yesterday);
      break;
    case 'weekly_summary':
      if (!input.history || input.history.length < 7) throw new Error('weekly_summary requires history[7]');
      user = buildWeeklySummaryUser(input.composite, input.history);
      break;
    default: {
      const _exhaustive: never = category;
      throw new Error(`Unhandled category: ${_exhaustive}`);
    }
  }
  return { system: AURORA_NARRATION_SYSTEM, user };
}
```

## Why this pattern (vs 4 separate system prompts)

**채택 — single shared system prompt**:
- ✅ 4-way drift 회피 — 38 §2.2 register update 시 1곳만 수정
- ✅ 3-gate safety filter (system prompt + containsForbiddenOutput + applySafetyFilter) behavior 4 categories 동일 — Day 7 architecture 그대로 inherit
- ✅ Option B guards 단일 진실 (system prompt 안에 명시) — 4 user-prompt builders는 instruction만 변형
- ✅ Future 5th/6th category 추가 시 user builder + switch case만 추가
- ✅ exhaustive switch never guard로 누락 case TypeScript compile-time catch

**폐기 — 4 separate system prompts**:
- ❌ 4-way drift risk — register / Option B guards 4번 sync 부담
- ❌ safety filter behavior 검증 4× 부담
- ❌ register 일관성 보장 어려움 (38 §2.2 update 시 4 prompts 동기화 부담)

## Sentence count per category (Day 9 operator decision)

- `morning_brief`: 2-3 sentences (Day 7 그대로 유지)
- `single_indicator_focus`: **2-4 sentences** (Day 9 evolve, 단일 indicator 분석 detail 필요)
- `score_change`: 2-3 sentences (간결한 변화 narrative)
- `weekly_summary`: **3-5 sentences** (trend retrospective 풍부)

Per-category instruction snippet은 user-prompt builder 안에서 "이 category는 X-Y 문장으로 작성하세요" 명시.

## Option B compliance per category (Day 9 sub-task 1 verify)

각 category instruction snippet에 명시적 forbidden 어휘 명시 (4 categories sample):

| Category | Forbidden 어휘 examples |
|---|---|
| morning_brief | "추천/권장/비중/매수/매도/timing 어휘 금지" |
| single_indicator_focus | "이 지표가 어디로 갈지 예측 금지 / 이 지표만 보고 행동 권유 금지" |
| score_change | "urgency framing 절대 금지 / '지금이 매수 시점' / '지금이 timing입니다' / '비중 늘려보세요' 절대 금지" |
| weekly_summary | "'다음 주는 X 시점' / '주간 trend가 매수 권유' 등 forward-looking advisory 절대 금지" |

특히 **score_change**가 most-risk category (urgency framing 가능성) — system prompt 명시적 guard + containsForbiddenOutput regex set + applySafetyFilter 3-gate. Day 9 architectural decision: 3-gate 그대로 유지 (Day 7 ship된 architecture).

## How to add a 5th category (future-proof recipe)

1. `NarrationCategory` type union에 새 string literal 추가 (e.g., `'volatility_spike_alert'`)
2. `buildVolatilitySpikeAlertUser` user-prompt builder 신규 함수 — per-category instruction (sentence count + Option B forbidden 어휘 + register)
3. `switch (category)`에 새 case 추가 — required field validation + `buildVolatilitySpikeAlertUser` 호출
4. `AuroraNarrationInput` interface에 optional field 추가 (e.g., `vix_data?: VixSpikeEvent`)
5. Tests:
   - aurora-prompt.test.ts: 새 category prompt shape verify + required field missing throws
   - route.test.ts: 새 category 200 path + per-category required field 400 + safety filter pass

TypeScript exhaustive switch never guard가 #3 누락 시 compile error로 자동 catch.

## Cross-references

- [[dual-mascot-safety-filter]] — 3-gate architecture, Day 9에 unchanged
- [[aurora-narration-assistant-mode-safety-filter-limit]] — Day 7 known limit, Day 9 4-category expansion이 regression 안 함 (Layer 1/2 user-input filter 가정은 그대로, defense-in-depth)
- [[option-a-clean-break-w1-w2]] — Day 6 W1 supersedes W2 pattern과 다른 영역 (Day 9는 W2 internal evolution, W1 supersede 아님)
- [[vault-sot-priority]] — Drift #14 light pointer entry

## W4 follow-up trigger

Day 7 assistant-mode safety filter limit 그대로 — Day 9 4-category expansion이 W4 safety-filter-tester re-run timing 변경 안 함. 단:
- W4 re-run 시 4 categories 모두 red-team patterns 실행 의무 (single_indicator_focus / score_change / weekly_summary는 Day 7 morning_brief 외 신규 surface)
- 특히 score_change implicit advisory leak 가능성 우선 검증

Source commit: a44a4b2 (Day 9 W2 Day 4 ship 2026-05-23)
