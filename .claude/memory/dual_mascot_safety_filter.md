---
name: dual-mascot-safety-filter
description: 3-layer safety filter (regex fails OPEN → Haiku classifier fails CLOSED → redirect template) applied at /api/mascot call-site, not in persona builders
metadata:
  type: project
---

Cohort's safety filter prevents advisory output (Strategic Decision 0 Option B). Source: `src/lib/claude/safety-filter.ts` (Day 4 commit 2606bd5, 182 lines).

**Architecture**:
- **Layer 1 — Regex classifier**: ADVISORY_TRIGGER_PATTERNS + INFORMATIONAL_PATTERNS → returns CLEAR_BLOCK / CLEAR_PASS / AMBIGUOUS. **Fails OPEN to AMBIGUOUS** (anything uncertain escalates).
- **Layer 2 — Haiku classifier** (claude-haiku-4-5-20251001): Only invoked on AMBIGUOUS. **Fails CLOSED to ADVISORY_REQUEST** (network/API failure = treat as advisory request, redirect).
- **Layer 3 — COHORT_FALLBACK_REDIRECT**: Template that explains the boundary without being preachy.

**Call-site placement**: Filter lives at `/api/mascot/route.ts` POST handler (Day 4 c1b2861), NOT inside aurora-prompt.ts or vesper-prompt.ts. This is deliberate — persona builders are pure prompt construction; safety is route-level orchestration. cohort-product sub-agent reviewers must accept PASS-with-explanation when they flag this.

**Pattern characteristics**: Contextual advisory (action + advice marker), never bare nouns. Compound red-team patterns added Day 4 (5 true bypasses found): "익절이 뭔지 모르겠는데 지금 해야 하나?" type — locked as regression tests in safety-filter.test.ts (76 unit tests).

**Logging**: mascot_chat table has `safety_filter_triggered` boolean + `safety_filter_category` string per turn, with `character` enum (aurora|vesper).

## Known limit — assistant-mode application (Day 7 W2 Day 2, commit 1d05856)

Day 7 Aurora narration pipeline ship 시 Layer 1/2가 user-input messages 가정으로 W1 Day 4에 authored됐는데, **Day 7은 Aurora의 server-side LLM output (assistant prose) 에 동일 filter pipeline 적용**. 이는 architectural mismatch지만 의도된 defense-in-depth trade-off:

- **False-positive (empathetic prose blocked)** = acceptable. Aurora register는 careful해서 false-positive 발생 시에도 Option B redirect template fallback. Never an Option B leak.
- **False-negative (soft phrasing slips through)** = real gap. Layer 1/2가 user "비중 늘려야 할까요?" 형태에 최적화 — assistant의 "비중 늘려보세요" (numeric % 없음) 또는 bare "기회입니다" 같은 implicit advisory soft phrasing은 catch 못 함.

Day 7은 3-gate defense-in-depth로 mitigate:
1. System prompt 자체 Option B 명시 (sonnet-4-6 self-policing ~95%+)
2. `containsForbiddenOutput` deterministic regex (~99%+)
3. `applySafetyFilter` 3-layer (Day 4 ship된 user-input filter, defensive third gate)

**W4 follow-up queued** (per 31-operator-manual-prerequisites-tracker.md):
1. safety-filter-tester sub-agent re-run with assistant-mode red-team patterns
2. Layer 2 system prompt rewrite for assistant-mode classification (LAYER2_SYSTEM_ASSISTANT 신규)
3. containsForbiddenOutput extension (6 soft-phrasing patterns)
4. regression test set 36 → 60+

Full architectural detail: [[aurora-narration-assistant-mode-safety-filter-limit]] (project memory, Day 7 created)

Related: [[strategic-decision-0-option-b]] [[aurora-narration-assistant-mode-safety-filter-limit]]
