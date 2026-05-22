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

Related: [[strategic-decision-0-option-b]]
