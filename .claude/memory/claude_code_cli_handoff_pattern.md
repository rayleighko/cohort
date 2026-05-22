---
name: claude-code-cli-handoff-pattern
description: Cowork drafts Day prompt with Tier 0 INIT + Day 0 verification gate + sub-task ack + END_OF_TURN A/B/C/D blocks for clean handoff
metadata:
  type: feedback
---

Every Day prompt sent from Cowork to Code CLI follows this skeleton (vault `~/Documents/elevate-portfolio/39-claude-orchestration-methodology.md` §2.1):

**Header**: "You are Claude Code CLI executing Cohort Sprint 0 W[X] Day [N]..."

**1. Tier 0 INIT** — vault reads + brand mapping confirmation (Aurora dovish/Vesper hawkish, Option B, mobile-first, PIPA, 5-week cap)

**2. /goal** — single-sentence stop condition for this Day

**3. Strategic constraints restate** — 5 immutable constraints listed

**4. Day 0 verification gate (MANDATORY)** — prereq checks (env keys, prior commits pushed, migrations applied, etc.). HALT if any fail.

**5. Sub-tasks** — numbered, ordered, with explicit deliverables

**6. Sub-agent dispatch** — which sub-agents to run + HALT conditions

**7. Stop point** — when to STOP and wait for operator review

**8. END_OF_TURN A/B/C/D** — required output blocks:
   - **A** = Day summary (what shipped)
   - **B** = next Day prompt skeleton draft
   - **C** = operator manual actions needed
   - **D** = vault/memory updates triggered

**Why**: This pattern caught HARD blockers (missing keys Day 2, missing bootstrap commit Day 5b) before time was wasted. Without Day 0 gate, would have wasted multiple hours on each.

**How to apply**: Never send Day prompt without all 8 sections. Code CLI must literally output A/B/C/D blocks at end (not paraphrase).

Related: [[ao-5-vault-wins]] [[vault-sot-38-to-43]]
