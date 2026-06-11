---
name: aurora-narration-assistant-mode-safety-filter-limit
description: Day 7 architectural decision — output-side safety filter is defense-in-depth, not a contract match. Records FORBIDDEN_OUTPUT_PATTERNS gaps for W4 closure.
metadata:
  type: project
  created_at: 2026-05-23
  source_commit: 1d05856
  followup_sprint: W4
---

Day 7 (W2 Day 2) Aurora narration pipeline ship 시 architectural 결정: output-side safety filter는 **defense-in-depth**, contract match가 아님.

## Architectural decision

Layer 1 (`ADVISORY_TRIGGER_PATTERNS` regex) + Layer 2 (Haiku classifier system prompt `LAYER2_SYSTEM`) 모두 **user-input messages** 분류용으로 W1 Day 4에 authored. Day 7은 Aurora의 **assistant prose** (server-side LLM output)에 동일 filter pipeline 적용. 이는 architectural mismatch지만 의도된 trade-off:

- **False-positive (empathetic prose blocked)** = acceptable. Aurora의 dovish/patient register는 매우 careful해서 false-positive 발생 시에도 Option B redirect template으로 fallback. Never an Option B leak.
- **False-negative (soft phrasing slips through)** = real concern. Layer 1/2가 user "비중 늘려야 할까요?" 같은 ADVISORY_REQUEST 형태에 최적화 — assistant의 "비중 늘려보세요" (numeric % 없음) 또는 bare "기회입니다" 같은 implicit advisory soft phrasing은 catch 못 함.

## Three-gate architecture (Day 7 commit 1d05856)

Aurora narration output은 다음 3개 gate 통과 후 client 전달:

1. **System prompt 자체 가이드** (`src/lib/aurora/aurora-prompt.ts` line ~50-90) — 38 §2.2 Aurora register verbatim + Option B 명시 ("never say 'buy now / sell / increase allocation / decrease cash / timing입니다'"). Sonnet-4-6이 system prompt 따라 self-policing. 통과율 보통 ~95%+
2. **`containsForbiddenOutput`** (deterministic regex on Aurora text) — explicit forbidden phrases catch (`/비중\s*(?:늘|줄)/`, `/매수\s*시점/`, `/지금\s*매수/`, `/매도\s*권/`, `/timing\s*입니다/` 등). 통과율 ~99%+
3. **`applySafetyFilter`** (3-layer user-input filter applied to Aurora output) — defense-in-depth. Layer 1 ADVISORY_TRIGGER_PATTERNS regex + Layer 2 Haiku classifier + Layer 3 redirect template. False-positive 시 redirect template 강제 적용

## FORBIDDEN_OUTPUT_PATTERNS gaps (W4 closure 대상)

W1 Day 4 ADVISORY_TRIGGER_PATTERNS가 catch 못 하는 assistant-mode soft phrasing 사례:

| 패턴 | 예시 | 현재 catch? |
|---|---|---|
| Imperative without numeric % | "비중 늘려보세요" / "비중을 좀 줄여보시는 것도" | ❌ (Layer 1 regex `/비중\s*\d/` 등 numeric assumption) |
| Bare opportunity language | "기회입니다" / "지금이 좋은 시점일 수 있어요" | ❌ (specific action verb 없음) |
| Modal future timing | "곧 매수 타이밍이 올 거예요" | ⚠ partial (timing 키워드만) |
| Conditional advisory | "만약 본인이 risk-tolerant라면 늘리는 것도" | ❌ (조건문에 advisory 숨김) |
| Allocation-direction implicit | "한국 macro가 약해 보이니 미국 비중을 고려해보세요" | ❌ (analytical framing으로 advisory wrap) |
| Comparative recommendation | "다른 자산이 더 매력적일 수 있어요" | ❌ |

containsForbiddenOutput (Day 7 commit)은 일부 catch하지만 위 패턴들의 variant는 여전히 가능.

## W4 follow-up 작업 (queued in 31-operator-manual-prerequisites-tracker.md)

1. **safety-filter-tester sub-agent re-run** — red-team patterns 다시 100+ 케이스 (sonnet-4-6 출력 sample 기반, 실제 Aurora 응답 패턴 분석)
2. **Layer 2 system prompt rewrite for assistant-mode classification** — 기존 LAYER2_SYSTEM이 user input 가정 → assistant prose 분류용 별도 LAYER2_SYSTEM_ASSISTANT 신규 작성 + applySafetyFilter에 mode flag 추가
3. **containsForbiddenOutput extension** — 위 6 패턴 family 모두 cover하는 regex set 확장
4. **regression test set 확장** — 36 → 60+ test cases (assistant-mode false-negative scenarios 추가)

## Day 7 commit reference

- `src/lib/aurora/aurora-prompt.ts` (109 LOC) — System prompt with Option B explicit guards
- `src/app/api/aurora/narration/route.ts` (235 LOC) — `containsForbiddenOutput` deterministic gate + `applySafetyFilter` defensive gate
- `src/lib/claude/safety-filter.ts` (W1 Day 4 ship) — 3-layer filter (Layer 1 regex + Layer 2 Haiku + Layer 3 redirect)
- 19 route tests including ADVISORY_REQUEST redirect verification

## Sprint policy

- **Sprint 0 W2-W5 launch**: 현 architecture 유지 (defense-in-depth + known limit 문서화). False-negative gap은 known limit으로 explicit하게 사장님 + Cowork side에서 인지하되 ship 차단 X
- **Sprint 0 W4**: safety-filter-tester re-run (above 4-task) — Aurora chat surface (W5) 전에 강화
- **V1.1**: Layer 2 dual-mode (user-input vs assistant-mode) 정식 architectural refactor

Related: [[dual_mascot_safety_filter]] [[vault_sot_priority]]
Source commit: 1d05856 (Day 7 W2 Day 2 ship 2026-05-23)
