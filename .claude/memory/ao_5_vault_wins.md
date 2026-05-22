---
name: ao-5-vault-wins
description: When vault SoT, Day prompt text, and CLAUDE.md disagree, vault wins — prompts must vault-verbatim or §reference, never paraphrase spec details
metadata:
  type: feedback
---

When information about Cohort exists in multiple places and they conflict, the resolution order is:

1. **Vault** (`~/Documents/elevate-portfolio/38-43`) — wins
2. **CLAUDE.md** (project working memory) — second
3. **Day prompt text** (Cowork → Code CLI) — lowest

**Why**: Day 5a 2026-05-22 — my Day prompt said "state colors × 50/500/700 shades" and "slower 700ms" but vault 42 §6.2 said single values and 600ms. Code CLI escalated, user confirmed "proceed with 42 §6.2 verbatim". This is the canonical AO-5 case: I hallucinated spec details in prompt rather than vault-verbatim or §reference.

**How to apply**:
- When drafting Day prompts that touch spec details (tokens, scoring formulas, schemas, copy), either copy vault verbatim OR reference by §number ("per 42 §6.2").
- Code CLI must HALT on conflict and ask, not silently follow either source.
- If vault drift is found in CLAUDE.md or prompt, fix the lower-priority document, not vault.

Related: [[vault-sot-38-to-43]] [[claude-code-cli-handoff-pattern]]
