---
description: Append a newly-discovered anti-pattern to vault 09-anti-pattern-log.md
allowed-tools: Read, Edit
---

When a new anti-pattern is discovered (something we should never do again, or something we should always do):

1. Read `~/Documents/elevate-portfolio/09-anti-pattern-log.md`
2. Classify the anti-pattern:
   - **AO-N** (orchestration): process / workflow / Day prompt / sub-agent dispatch
   - **AD-N** (design): UI / component / token / accessibility
   - **AL-N** (legal): copy that risks 자본시장법 / PIPA
   - **AE-N** (engineering): code / security / performance / dependency
3. Append entry with format:
   ```
   ## <AO|AD|AL|AE>-<next number>: <short name>
   **Discovered**: YYYY-MM-DD
   **What**: <1-2 sentences>
   **Why it's wrong**: <1-2 sentences>
   **Correction**: <1-2 sentences — the right pattern>
   **Enforcement**: <which skill/agent/hook catches this>
   ```
4. If a skill or sub-agent should enforce this going forward, also update:
   - `.claude/skills/<relevant-skill>/SKILL.md` (add to triggers/checks)
   - `.claude/agents/<relevant-agent>.md` (add to review checklist)
   - `CLAUDE.md` "Anti-patterns" section (one-line reference)
5. Commit with message: `docs(anti-pattern): add <AO|AD|AL|AE>-N <short name>`

Output: filed entry + which downstream files were updated.
