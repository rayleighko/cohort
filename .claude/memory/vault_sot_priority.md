---
name: vault-sot-priority
description: Light pointer to vault-level governance file (~/Documents/elevate-portfolio/vault_sot_priority.md) + Day-to-day implementation drift catalog for Code CLI auto-load
metadata:
  type: reference
  governance_master: ~/Documents/elevate-portfolio/vault_sot_priority.md
  last_synced: 2026-05-23
---

# Vault SoT Priority — Working Memory Pointer

본 file은 **light pointer** (working memory layer). Full governance authority는 vault file에 있음.

## Governance master file (READ FIRST when conflict arises)

**Path**: `~/Documents/elevate-portfolio/vault_sot_priority.md`
**Status**: v0.1 DRAFT (Cowork-side working position, operator sign-off pending via `23-operator-batch-review-prep` Section 10)
**Size**: 11 section / ~377 lines / 20KB

**이 light pointer는 vault file의 substitute가 아니다** — Code CLI auto-load 효율과 Day-to-day drift catalog 보존만 목적. Governance 결정 (DRAFT→LOCKED, cascade trigger, 7 domain SoT 분류 변경 등) 시 반드시 vault file에서 작업.

## Vault governance file 요약 (1-line per section)

| § | Vault file section | Cowork session 활용 시점 |
|---|---|---|
| 0 | Cowork scope notice — mechanical only, strategic은 Handoff escalate | 자동 통합 유혹 발생 시 |
| 1 | Supreme Authority — `00-master-context.md` 13개 영역 + §10.3 Cancelled OVERRIDES ALL | 다른 vault file과 00 충돌 시 |
| 2 | Master Context DRAFT(v1.1.7) vs LOCKED(v1.1.6) 처리 rule | v1.1.7 DRAFT scope 항목 적용 여부 판단 시 |
| 3 | Cluster B 단독 invest active / Cluster A 명시 abandon | Cluster A 관련 task 잔존 발견 시 |
| 4 | Domain SoT 매트릭스 (brand=38 / methodology=39 / design=40-43 / impl=14/25/26 / copy=17/24 / compliance=22/27 / anti-pattern=00§9+09) | 도메인 간 충돌 시 |
| 5 | Vault ↔ Cohort repo conflict (token=42, component=40, brand=38, anti-pattern=00§9+09) | tailwind/.claude/cohort 작업 시 |
| 6 | Working conventions — § notation + read-both-verbatim + escalate workflow | 작업 진행 중 |
| 7 | Cascade rule (38→all, 39→all, 00→all) — 모두 수동 23-batch-review-prep gate | vault SoT file 변경 시 |
| 8 | β rule status — Cowork-side de facto deprecated, README formal 변경 대기 | file count 관련 의문 시 |
| 9 | Deferred S1-S5 — vault governance / β rule / anti-pattern naming / cascade auto / Cluster A archive | strategic decision 발견 시 |
| 10 | Version history (v0.1 2026-05-23) | — |
| 11 | Cowork session reference checklist | 매 세션 시작 시 |

## Day-to-day implementation drift catalog (vault file Section 9에 없는 항목, Cowork session 발견)

vault governance file은 vault file 간 meta-level conflict를 다룬다. 아래는 **implementation layer의 day-to-day drift** — Day 6 (2026-05-23) Cowork session에서 empirical 검증된 충돌. Code CLI sub-task 진행 중 reference.

### Drift #1 — Cache layer (3-way conflict, ADR target W3 Day 1)

| Source | Position |
|---|---|
| `14-architecture` line 51, 140, 315 | Redis (Upstash) |
| `26-spec` line 67, 78, 82-85 | Supabase `macro_cache` table + 15-min TTL + `CREATE TABLE` migration |
| Day 6 prompt v2 (2026-05-23) | in-memory Map + 1h TTL (operator conscious simplification) |

**Status**: Day 6 ship commit 31b5f40 = in-memory + 1h 적용 완료. ADR W3 Day 1 prereq. (vault file Section 4.4 domain은 implementation spec — 25/26 derivative 우선이지만 14는 architecture로 별도 SoT layer → matrix unresolved)

### Drift #2 — Composite signature evolution (25-w1 §5.3 vs 26-spec UI 요구) — RESOLVED Day 6

- `25-w1 §5.3` defines `computeCompositeScore(): Promise<MacroScores>` — single composite number + 4 normalized scores. W1 `src/lib/macro/composite-score.ts` 62 LOC가 이 시그니처로 구현됐었음.
- `26-spec` Tier 0 UI sketch requires zone label + key driver + indicators[] — needs `MacroComposite { zone, keyDriver, indicators[], degraded }`.
- `26-spec` line 96 cross-references `25-w1 §5.3` as template, but does NOT explicitly mark the signature as evolving.

**Resolution (Day 6 ship commit 31b5f40, vault file Section 4.4 적용)**: W2 spec (26) supersedes W1 (25) when W2 evolves a signature. Sub-task 1.5 reconcile plan → **Option a (Clean break) 채택** — composite-score.ts 삭제, composite.ts 신규 (pure `computeMacroComposite`), MacroScores type 삭제. 신규 memory file [[option_a_clean_break_w1_w2]] (feedback) 등록.

### Drift #3 — 26-spec mascot naming (vault drift, 38 supersedes) — Cleanup pending

- `26-spec` (2026-05-20) uses "준/joon" throughout (line 17, 30, 35, 52, 109 + 20 more).
- `38-brief` (2026-05-21 LOCKED) §1: "Replaces all '준 / Joon / Joon-Mate' legacy references in vault."

**Resolution (vault file Section 4.1)**: `38` wins for brand domain. `26` line-by-line cleanup PR target: **W2 종료 시점 batch fix**. Day 6 ship commit 31b5f40 = Aurora 🕊 naming 적용 완료 (src/lib/aurora/, AuroraPlaceholderCard 등).

### Drift #4 — CLAUDE.md payment drift (Toss → Polar) — Cleanup pending

- CLAUDE.md Stack section: `Toss Payments KRW V1 + Polar USD Sprint 1+`
- 실제 코드 (Day 3 ship): Polar live, Toss deferred to Sprint 1+
- Vault `25-spec §4`, `00-master-context`, `14-architecture`, `31-tracker` may still mention Toss

**Resolution**: `tomorrow-handoff-guide §3` catalog. Cleanup PR target: **W2 종료 시점**. `polar_payment_architecture.md` (memory) already reflects truth.

### Drift #5 — 25-w1 §5.3 calibration vs 24-seo Page 5 calibration (NEW, Day 6 발견, RESOLVED Option α)

W2 Day 1 (Day 6) Code CLI가 sub-task 1 vault verbatim extraction 중 empirical 검증한 vault 자체 내부 calibration 불일치. **Day 5a state colors drift와 동급 AO-5 사례**.

| Indicator | 25-w1 §5.3 -10 anchor | 24-seo Page 5 -10 anchor | 실 시장 범위 | 25-w1 over-shoot |
|---|---|---|---|---|
| 한미 금리차 | 5.0% | 2.5% | 0.8-1.8% (24-seo line 766-769) | **2x 비현실적** |
| KRW | 1550 | 1550+ (asymmetric) | (시장가) | match |
| VIX | 30 | 35 (asymmetric, lower slope) | (panic 35+) | over |
| DXY | 120 | 110 | (BBDXY 95-110) | **2x 비현실적** |

**Resolution (Day 6 ship commit 31b5f40)**: **Option α 채택** — 24-seo Page 5 calibration verbatim 적용 + KRW/VIX asymmetric piecewise linear normalize. 신규 memory file [[w2_day1_macro_calibration_alpha]] (project) 등록. 근거: 26-spec line 37이 24-seo Page 5를 formula source로 explicit cross-ref ("Composite macro score (per 24-seo Page 5 formula)"). 25-w1 §5.3 = template shape only, calibration이 아님. W2 종료 batch cleanup: 25-w1 §5.3에 inline annotation "calibration is illustrative; production calibration per 24-seo Page 5".

### Drift #6 — /dashboard route path (26-spec vs Day 6 prompt, RESOLVED Day 6)

- `26-spec` line 47: `src/app/(dashboard)/page.tsx` → URL `/` (collision with Day 5b landing Version C)
- Day 6 prompt + ship: `src/app/(dashboard)/dashboard/page.tsx` → URL `/dashboard`

**Resolution**: Day 5b landing Version C 보존 + Code CLI 권장 정합. W2 종료 batch cleanup: 26-spec line 47 annotation으로 정정.

### Drift #7 — 26-spec W2 file additions composite-score.ts + MacroScores shape (RESOLVED Day 6, cross-ref cleanup pending)

- `26-spec` line 67 `composite-score.ts` + W2 file additions block에 MacroScores shape 명시
- Day 6 ship (Option a clean break) = composite-score.ts 삭제 + MacroScores type 삭제 + composite.ts + MacroComposite type 신규

**Resolution**: vault_sot_priority.md §4.4 evolution rule 적용 (Drift #2와 같은 family). W2 종료 batch cleanup: 26-spec W2 file additions 갱신 (composite-score.ts → composite.ts, MacroScores shape annotation → MacroComposite reference).

### Drift #8 — 26-spec Aurora naming Day 7 cleanup (RESOLVED Day 7 ship 1d05856, vault cleanup pending)

Day 7 (W2 Day 2) Code CLI sub-task 1 vault verbatim extraction 중 추가 확인: 26-spec line 109-122 (W2 Day 4 narration system) + 시리즈 file path references가 모두 "준/joon" 명명 사용. 38-brief §1 LOCKED 후 진화한 Aurora 🕊 명명과 충돌.

| Source | Position |
|---|---|
| 26-spec line 109-122 (W2 Day 4) | "준 narration system" + `src/lib/joon/narration-templates.ts` + `/api/joon/narration/route.ts` + `JoonNarration.tsx` |
| 38-brief §1 (2026-05-21 LOCKED) | "Replaces all '준 / Joon / Joon-Mate' legacy references in vault." |
| Day 7 ship (commit 1d05856) | `src/lib/aurora/aurora-prompt.ts` + `/api/aurora/narration/route.ts` + `AuroraNarrationCard.tsx` |

**Resolution (Day 7 ship)**: Aurora naming 적용. 26-spec line 109-122 W2 종료 batch cleanup queue (Drift #3과 같은 family). vault_sot_priority §4.1 (brand 38 supersedes) 정합.

### Drift #9 — 26-spec Day 4 template-only → Claude API evolution (RESOLVED Day 7 ship 1d05856, vault cleanup pending)

Day 7 사장님 결정 의식적 evolution. 26-spec line 114 verbatim: *"Implement `/api/joon/narration/route.ts` — template-based generation (no Claude API for W2, just templates)"*. Day 7 prompt + 사장님 결정 = actual sonnet-4-6 generation + 3-layer safety filter pipeline (defense-in-depth).

| Source | Position |
|---|---|
| 26-spec line 114 | "template-based generation (no Claude API for W2, just templates)" |
| Day 7 prompt v1 P2 | "All Aurora narration responses pass through applySafetyFilter (3-layer)" + "Claude sonnet-4-6 via src/lib/claude/client.ts" |
| Day 7 ship (commit 1d05856) | callPersona('aurora', ...) sonnet-4-6 + containsForbiddenOutput + applySafetyFilter 3-layer |

**Resolution**: Per vault_sot_priority §4.4 W2 evolution rule (Drift #2 / #5 / #7 family — W2 implementation legitimate evolution of W1/W2 stub). 26-spec line 114 annotation at W2 close: "Day 7 evolution per operator decision — sonnet-4-6 generation + 3-layer output safety filter; template-only was W2 prep version, superseded".

**Architectural follow-up**: Layer 1/2 safety filter는 user input 용 설계이나 Day 7 assistant output에 적용. Defense-in-depth로 working but false-negative gap on soft phrasing — W4 safety-filter-tester re-run + Layer 2 prompt rewrite for assistant-mode queued. 신규 memory [[aurora_narration_assistant_mode_safety_filter_limit]] (project) 등록.

### Drift #11 — CompositeScoreCard naming (26-spec line 105 vs Day 6 ship inline, FULLY RESOLVED Day 10 ship b6d07dc)

- `26-spec` line 105 명시: *"CompositeScoreCard.tsx — composite + 5-zone color coding (risk-off red → risk-on green)"*
- Day 6 ship (commit 31b5f40): inline'd as `CompositeCard` inside `src/app/(dashboard)/dashboard/page.tsx` (별도 file 없음)
- W1 stub `src/components/shape-a/CompositeScore.tsx` (`return null;` + TODO comment) — Day 6 sub-task 1.5 reconcile 시 untouched 유지
- **Day 10 ship (commit b6d07dc, 2026-05-24)**: W1 stub `CompositeScore.tsx` deleted per [[option_a_clean_break_w1_w2]] (zero callers verified). cohort repo side fully resolved

**Resolution (cohort repo side ✅ complete)**: Day 10 cohort repo cleanup 완료. **vault annotation pending** (W2 종료 batch Cowork trace) — 26-spec line 105 annotation: *"Day 6 evolution — inline'd in page.tsx as CompositeCard; W1 stub deleted Day 10"*.

### Drift #12 — MacroDashboard.tsx (26-spec line 103 vs Day 6 ship inline, FULLY RESOLVED Day 10 ship b6d07dc)

- `26-spec` line 103 명시: *"MacroDashboard.tsx — vertical stack layout (mobile-first)"*
- Day 6 ship (commit 31b5f40): inline'd as `MacroBody` async function inside `src/app/(dashboard)/dashboard/page.tsx`
- Day 8 polish (commit e00764e): 같은 page.tsx 안에서 `IndicatorList` → `IndicatorGrid` 패치 (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3` per 26-spec line 107)
- W1 stub `src/components/shape-a/MacroDashboard.tsx` (`return null;` + TODO comment) — Day 6 sub-task 1.5 untouched
- **Day 10 ship (commit b6d07dc, 2026-05-24)**: W1 stub `MacroDashboard.tsx` deleted per [[option_a_clean_break_w1_w2]] (zero callers verified). cohort repo side fully resolved

**Resolution (cohort repo side ✅ complete)**: Day 10 cohort repo cleanup 완료. **vault annotation pending** (W2 종료 batch Cowork trace) — 26-spec line 103 annotation: *"Day 6 evolution — inline'd in page.tsx as MacroBody; W1 stub deleted Day 10. Day 8 IndicatorGrid responsive grid added (md/lg)"*.

### Drift #15 — 26-spec W1 outputs claim "joon_chat persistence" vs W1 actual ship (RESOLVED Day 11 ship 309f6ca, vault annotation pending)

- `26-spec` line 17 verbatim (W1 outputs claim): *"Claude API + 준 chat surface + safety filter 3-layer + joon_chat persistence"*
- W1 actual ship (Day 4 commit 2606bd5): `safety-filter.ts` only — **chat surface 없음, joon_chat table 없음**
- **Day 11 ship (commit 309f6ca, 2026-05-24)**: `aurora_chat` migration 0005 + `/api/aurora/chat` route + MascotChatBubble/ChatWindow/ChatMessage — W1 deferred claim을 W3 Day 1에 Aurora naming으로 delivery (7일 late)

**Resolution (Drift #2/#7/#9 evolution family)**: vault internal claim drift (W1 outputs spec과 W1 actual ship mismatch). Day 11 ship이 deferred claim을 fulfill. **vault annotation pending** (W2 종료 batch Cowork trace) — 26-spec line 17 annotation: *"Day 11 evolution — joon_chat surface + persistence deferred from W1 to W3 Day 1 scaffold (aurora_chat table 0005, joon→aurora naming per Drift #3/#8 cleanup); W5 Day 4 full per operator decision"*.

### Drift #16 — 26-spec W5 Day 4 chat full spec ↔ Day 11 W3 Day 1 scaffold pull-forward (RESOLVED Day 11 ship 309f6ca, vault annotation pending)

- `26-spec` line 411 + 513-524: *"W5 — ... + In-app chat full + Launch prep"* + W5 Day 4 chat full spec verbatim (JoonChatBubble + ChatWindow + ChatMessage + multi-turn 20-message + 3-layer safety filter + joon_chat persistence)
- **Day 11 operator decision (2026-05-24)**: Pull W5 Day 4 chat scaffold forward 2 weeks → W3 Day 1 scaffold. Day 7-9 narration infra direct extension legitimate.
- Day 11 ship: scaffold only (MascotChatBubble + ChatWindow + ChatMessage + /api/aurora/chat + aurora_chat 0005 + nullable user_id W5 future-proof). W5 Day 4 retains full-rewrite scope with Day 11 scaffold as baseline.

**Resolution**: 2-week pull-forward legitimate evolution per [[option_a_clean_break_w1_w2]] §"W2 supersedes W1 when signature evolves" family (W3 Day 1 scaffold supersedes deferred plan, W5 Day 4 retains future expansion timing). **vault annotation pending** (W2 종료 batch Cowork trace) — 26-spec line 513-524 annotation: *"Day 11 scaffold pull-forward — MascotChatBubble + ChatWindow + ChatMessage + /api/aurora/chat + aurora_chat 0005 ship (joon→aurora naming Drift #3/#8 cleanup applied). W5 Day 4 scope: hydrate UI history on mount; focus trap + per-message SR speaker semantics; useScrollLock hook; FAB hide-on-modal; modal entry animation; auth-scoped chat (user_id population + RLS SELECT policy)"*.

**Sub-pattern note**: Code CLI sub-task 1 HALT REPORT가 prompt 자체의 stale assumption "W4 Day 4"를 정확히 catch ([[prompt_stale_assumption_verify_gate]] 2nd successful invocation, Day 10 2xl breakpoint 1st). Pattern proven durable across 2 consecutive Day prompts.

### Drift #13 — Favicon asset filename + manifest.json split-brain (RESOLVED Day 8 ship e00764e)

- `vault 44 §2.2` 명시: `icon-{192,512}.png` + `maskable-icon-512.png` filename convention
- realfavicongenerator.net export (사장님 자산): `web-app-manifest-{192,512}x{192,512}.png` filename convention
- Day 8 ship: placeholder `public/manifest.json` deleted + `public/site.webmanifest` updated to Cohort branding + reference both PNG + SVG icons (maskable distinct). `src/app/layout.tsx` metadata.icons + manifest swap.

**Resolution**: 사장님 workflow output (realfavicongenerator export convention) 채택. vault 44 §2.2 filename naming은 reference only — actual filename은 export tool에 따라 달라질 수 있음. W2 종료 batch cleanup: vault 44 §2.2 annotation *"naming variant acceptable — realfavicongenerator.net export convention compatible (web-app-manifest-*.png and icon-*.png 모두 가능)"*. PWA install + browser tab favicon 정상 작동 확인 (Day 8 Block A favicon verify section).

### Drift #14 — Aurora narration category naming (RESOLVED Day 9 ship a44a4b2)

- `26-spec` line 112 명시: narration category 중 하나를 `macro_overview` 명명
- `38-brief §2.2` line 110 명시: *"Morning brief (default daily ritual)"* — Aurora의 primary surface
- Day 7 ship (commit 1d05856) + Day 9 ship (commit a44a4b2): `morning_brief` 명명 사용 (38 §2.2 정합)

**Resolution (Drift #3/#8 brand-naming family)**: vault_sot_priority §4.1 brand domain hierarchy — 38 supersedes 26. Day 9 ship apply `morning_brief` to 4-category enum (`'morning_brief' | 'single_indicator_focus' | 'score_change' | 'weekly_summary'`). 26-spec line 112 annotation W2-close: *"macro_overview renamed morning_brief per 38 §2.2 brand alignment"*.

**Architectural insight from Day 9**: 4 categories 채택 시 **단일 AURORA_NARRATION_SYSTEM + per-category user prompt branching** pattern 적용 — 4-way system prompt drift 회피 + register 일관성 자동 보장 + exhaustive switch never guard. 신규 memory [[aurora_narration_4_category_routing]] (project) 등록.

---

## Vault enhancements (not drift — Cowork direct contributions)

이 section은 drift catalog가 아닌 Cowork이 vault SoT 자체를 *enhance*한 항목 누적. Drift와 구분되는 이유: drift = vault SoT 간 또는 vault-code 간 충돌, enhancement = vault SoT를 확장한 contribution.

### V1 — vault 44 §3 Brand logo system specs 신설 (2026-05-23 W2 Day 2)

사장님이 favicon (§2.2) ship 후 "favicon ≠ 로고" 관찰을 제기. vault 44가 P0-P3 8개 자산만 다루고 brand logo system (wordmark / lockup / monochrome variants / Lottie)이 누락되어 있음을 발견.

**Contribution**: vault 44 §3 "Brand logo system specs" 신설 — Primary brandmark large + Wordmark Korean/English + 4 Lockup variations + Monochrome variants + Clear space rules + Lottie deferred to V1.1. §0 priority table 6 row 추가 (#9-#14). 기존 §3-§7 renumber to §4-§8. Cowork direct write to vault file (manual merge 불필요).

## Working memory ↔ vault sync rules

- `.claude/memory/*.md` = **light auto-load context** (333 LOC total across ~15 files). 본 file도 그 일부.
- Vault = deep SoT (각 file 10K+ LOC). Read on demand by Code CLI.
- vault governance file 업데이트 시 본 light pointer의 "Vault governance file 요약" table sync 의무 (cross-file cascade).
- Drift catalog 신규 항목은 본 file에 누적, vault file Section 9 (deferred strategic) 또는 vault file Section 5.1 (implementation conflict)로 escalate 여부 판단.

## How to add a new drift entry (Day 6+ Cowork session)

1. Vault file Section 6.2 working step 따름 — **Read both verbatim** (paraphrase 금지)
2. Vault file Section 1-5 priority matrix로 resolution 가능 여부 판단
3. Matrix로 resolution 시 → 본 file "Day-to-day implementation drift catalog"에 entry 추가 + resolution 명시
4. Matrix로 unresolved 시 → vault file Section 9 deferred decision 추가 + 23-batch-review-prep Section 10 안건 등록
5. Block D drift entry 의무 (END_OF_TURN report 시)

Related: [[ao_5_vault_wins]] [[vault_sot_38_to_43]] [[claude_code_cli_handoff_pattern]]
Vault governance master: `~/Documents/elevate-portfolio/vault_sot_priority.md` v0.1 DRAFT
