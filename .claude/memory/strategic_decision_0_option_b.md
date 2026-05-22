---
name: strategic-decision-0-option-b
description: Cohort delivers Information + Tool + Decision Support only — NEVER 추천/권장/지금 매수/비중 X%/timing입니다 (자본시장법 자문업 회피)
metadata:
  type: feedback
---

Cohort operates strictly as Information + Tool + Decision Support. The product never gives personalized investment advice, recommendations, allocation percentages, timing prescriptions, or any output that triggers Korean 자본시장법 자문업 registration requirements.

**Banned patterns** (Layer 1 regex + Layer 2 Haiku classifier enforce):
- 추천 / 권장 / 매수하세요 / 매도하세요 / 비중 X% / 지금이 timing입니다 / 사야 합니다
- "이 종목 어때요?" → MUST redirect (never answer)
- Compound "definition + advisory" patterns ("X가 뭔지 모르겠는데 지금 해야 하나?")

**Why**: Solo founder + no 자문업 license. Even one advisory output → regulatory exposure + product credibility collapse. This is the single hardest constraint and supersedes UX convenience.

**How to apply**:
- Every Aurora/Vesper output passes 3-layer safety filter ([[dual-mascot-safety-filter]]).
- Every UI label, error message, microcopy passes cohort-ux-copy skill check.
- Every marketing copy passes brand-review.
- When in doubt, redirect to COHORT_FALLBACK_REDIRECT template.

Related: [[dual-mascot-safety-filter]] [[brand-lock-2026-05-21]]
