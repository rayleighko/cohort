---
name: prompt-stale-assumption-verify-gate
description: Day 10 W2-close cleanup ship에서 stale "Day 8 deferred 2xl" assumption catch한 pattern — future prompt drafting 시 sub-task 1 verify HALT 의무
metadata:
  type: feedback
  created_at: 2026-05-24
  source_commit: b6d07dc
  pattern_origin: Day 10 sub-task 1 HALT REPORT
---

Cowork이 외부에서 prompt 작성 시 "deferred", "stale", "pending" 등 cohort code state 가정을 sub-task 1 HALT REPORT gate에서 **empirical verify 의무**.

## Case origin (Day 10 W2-close cleanup, 2026-05-24, commit b6d07dc)

**Stale assumption**: Day 8 prompt v2 (2026-05-23) + Day 10 prompt v1 (2026-05-23) 모두 "Add screens.2xl ('1536px') per 42 §6.2 (deferred from Day 8)" 명시. **실제로는 Day 5a (commit c722bc2d, 2026-05-22) tailwind token bootstrap 시 이미 추가됨**.

**Catch mechanism**: Day 10 sub-task 1 "Cleanup target verify — REPORT ONLY, HALT for operator verify" gate에서 Code CLI가 `tailwind.config.ts` empirical read → "Already present since Day 5a" 명시 보고 → 사장님 verify → revised plan (sub-task 2 SKIP no-op + commit message에서 2xl 라인 제거).

**Outcome**: 
- 0 lines of no-op code shipped (sub-task 2 skipped)
- Commit message accurate (no false claim "added 2xl")
- Pattern validated — sub-task 1 HALT REPORT gate works as designed

## Pattern (future prompt drafting 의무)

**Cowork이 외부 prompt 작성 시 다음 assumption 들을 sub-task 1 verify HALT 의무**:

| Assumption type | Verify command (sub-task 1 REPORT) |
|---|---|
| "Day X에서 deferred됨" | `git log --grep="<topic>"` + cohort code state grep |
| "W1 stub 잔존" | `ls src/components/**/*.tsx` + grep imports |
| "26-spec line X 명시" | `~/Documents/elevate-portfolio/26-sprint-0-w2-w5-implementation-spec.md` verbatim line read |
| "이전 ship 작동 안 함" | dev terminal 또는 production log empirical check |
| "Test baseline X tests" | `pnpm vitest run` 또는 `pnpm test --run` |
| "Env var 누락" | `.env.local` + Vercel env vars 둘 다 grep |
| "Migration 미적용" | `supabase migration list` (local) 또는 Supabase Studio 직접 |

## How to apply

1. **Prompt drafting 시점**: Cowork이 Day X prompt 작성할 때 "deferred", "stale", "pending", "잔존" 키워드 사용 시 **명시적으로 sub-task 1에서 verify 의무** prompt 본문에 명시
2. **Sub-task 1 wording**: "REPORT ONLY, HALT for operator verify" 명시 + "premise verify" 항목 명시 (예: "Day X deferred 가정 사실 확인")
3. **Code CLI 자동 catch**: Code CLI가 sub-task 1에서 empirical verify 결과를 "**Already present since Day Y**" 또는 "**Stale assumption — premise was X but actual is Y**" 형태로 report
4. **사장님 verify**: REPORT 받고 revised plan 결정 (skip / modify / proceed as-is)
5. **Commit message**: stale assumption 제거 + actual state 반영 ("Note: tailwind 2xl breakpoint already present since Day 5a (c722bc2); no-op skipped.")

## Why this matters

**Vault SoT only 의존의 한계**: Cowork은 prompt 작성 시 vault SoT (38/40/41/42 + 26-spec 등) 만 보고 작성하면 cohort code state 실제와 drift 가능. vault SoT는 spec, cohort code는 ship된 reality — 둘 사이 gap 자연 발생.

**Sub-task 1 HALT가 bridge**: empirical verify가 vault assumption vs reality gap을 prompt 진행 전에 catch. 0 line of no-op shipped + accurate commit message.

**Related anti-patterns**:
- [[ao-5-vault-wins]] — vault verbatim 의무 (paraphrase 금지)는 같은 family의 다른 측면 (vault read 시점 verbatim, 단 prompt drafting 시점은 cohort code state도 empirical verify)
- [[option-a-clean-break-w1-w2]] — "Apply when ALL three conditions hold" — grep zero callers 같은 empirical verify와 같은 정신

## Day 10 catch result (verbatim)

> "screens: { xs: '380px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px', // wide (40 §2.7) — additive, mobile-first preserved },
> Already added on Day 5a (c722bc2d, 2026-05-22) per cohort-day-status.md memory. Sub-task 2 is a no-op — the Day 10 prompt premise that this was 'Day 8 deferred' is stale."

## Sub-task 1 HALT pattern future applications

향후 Day 11+, W3, W4, W5 모든 prompt 작성 시 본 pattern 적용:
- Day 11 Aurora chat scaffold: "W4 Day 4 chat full spec" verbatim verify in sub-task 1 (W3 Day 1 evolution 정당성 확인)
- W3 Day 1+ Shape A 50+ indicator: "DART_API_KEY 발급 완료" verify in Day 0 gate
- W4 Day 4 chat full: Day 11 scaffold result 그대로 사용 + W3 deferred 부분 추가
- W5 Day 1 launch prep: 모든 cumulative drift catalog cohort repo side resolved verify

본 pattern은 sub-task 1 형식 표준화 — **모든 Day prompt가 sub-task 1 verify HALT를 포함**해야 함. 단 sub-task 1 scope는 prompt 내 가장 risky assumption 1-3개로 제한 (over-verify 방지).

## 2nd successful invocation — Day 11 W4 Day 4 → W5 Day 4 catch (2026-05-24)

**Stale assumption**: Day 11 prompt v1 (2026-05-24, Cowork 작성)이 "26-spec W4 Day 4 chat full spec"이라고 4번 명시. 실제로는 **W5 Day 4 chat full spec** (26-spec line 411 + 513-524).

**Cowork prompt drafting 시 발생한 원인**:
- Cowork이 26-spec line 17 W1 outputs claim "joon_chat persistence" verbatim 본 후 chat surface가 어느 W에 spec됐는지 imagine
- "W4"는 사장님이 자주 사용하는 shorthand (Cowork이 일부 prompt에서 W4-W5 묶음 표현 사용)와 mixed → Day 11 prompt에서 "W4 Day 4"로 잘못 작성
- 실제 spec verify 안 함 (vault 26-spec line 411 verbatim — "W5 — ... + In-app chat full" 명시)

**Catch mechanism**: Day 11 sub-task 1 "Vault extraction — REPORT ONLY, HALT for operator verify" gate에서 Code CLI가:
1. 26-spec verbatim search ("chat surface", "chat scaffold", "MascotChat", "ChatBubble", "aurora_chat") → line 411 W5 명시 발견
2. Drift catch report: *"the spec says W5 Day 4 (not W4 Day 4) for the chat full"* + 4 stale instances 표 + 1-week shift implication 분석 + scope verbatim 추출
3. 5개 verify items 사장님 confirm 요청 (default-yes recommend)

**Outcome**:
- 1-week → 2-week pull-forward 정확히 reframe (Day 11 scaffold = W5 Day 4에서 2주 앞당김)
- Drift #15 (W1 outputs claim) + Drift #16 (2-week pull-forward) catalog 추가
- Commit message accurate (no false "W4 Day 4" claim)
- Pattern 2회 연속 invocation proven durable

## 3+ invocation projection

Pattern이 future Cowork prompt drafting에서 stale assumption catch 지속 — 의도된 design:

1. Cowork은 prompt 작성 시 vault SoT (38/40/41/42/26-spec 등) 만 보고 작성하면 정확하지 않은 inference (e.g., "W4 Day 4" — actual W5 Day 4) 가능
2. Code CLI는 sub-task 1 HALT REPORT gate에서 empirical verbatim verify
3. 사장님은 catch report 받고 default-yes confirmation
4. Sub-task 2+ proceed with corrected scope

**Cowork prompt drafting 시 명시적 self-guard**:
- Day prompt drafting 전 "26-spec line X verbatim" reference 시도 시 actual line 번호 + verbatim quote include
- "deferred", "stale", "pending" 키워드 사용 시 즉시 catch obligation
- "evolution from W X Day Y" framing 시 W/Day verbatim verify

향후 Day prompt마다 sub-task 1 HALT REPORT 유지 — pattern 진행 중.

Related: [[ao-5-vault-wins]] [[option-a-clean-break-w1-w2]] [[claude-code-cli-handoff-pattern]]
Source commit: b6d07dc (Day 10 W2-close cleanup 2026-05-24)
