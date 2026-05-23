---
name: option-a-clean-break-w1-w2
description: When W2 spec genuinely evolves a W1 signature, prefer clean break — delete W1 stub, remove W1 type, no deprecated wrappers
metadata:
  type: feedback
  case_origin: W2 Day 1 (Day 6, 2026-05-23) composite signature evolution
---

When W2 spec evolves a W1 signature with a genuine progression, prefer **clean break**: delete the W1 stub, remove the W1 type, no `@deprecated` wrappers, no thin adapters.

**Case origin (W2 Day 1, 2026-05-23)**: composite signature evolved from `computeCompositeScore(): Promise<MacroScores>` (W1 §5.3, 4 flat numbers) to pure `computeMacroComposite(input): MacroComposite` (W2, zone + keyDriver + indicators[] + degraded). Three options considered (clean break / side-by-side+deprecation / thin wrapper). Clean break chosen — composite-score.ts deleted, MacroScores removed from shapes.ts, ecos.ts/fred.ts bodies fully replaced.

**Why**:

1. **Zero production callers** of old API (verified by grep). Side-by-side/thin-wrapper preserve dead surface area.
2. **CLAUDE.md system instruction explicit**: "Avoid backwards-compatibility hacks... If you are certain that something is unused, you can delete it completely."
3. **vault_sot_priority.md §4.4 evolution rule**: when W2 spec genuinely evolves the signature (here: pure function + observations + zone bands + degraded mode = material progression, not stylistic), W2 supersedes W1.
4. **AO-5 protection preserved**: W1 §5.3 verbatim text lives in vault forever — deletion from repo doesn't lose spec authority, only removes a snapshot that has been superseded.
5. Smallest code surface, cleanest test slate, lowest reviewer cognitive load.

**Apply when ALL three conditions hold**:
- **grep zero production callers** of old API (TODO comments excluded — those are stale anyway)
- **W2 SoT explicitly evolves the signature** (not just stylistic rename; check that new shape carries materially new information)
- **Test slate is clean** OR migrate-able in same commit

**Do NOT clean-break when**:
- Production callers exist (use side-by-side + deprecation)
- W2 evolution is purely stylistic (rename without information change → keep W1, update CLAUDE.md naming convention only)
- Tests reference old signature without easy migration path

**Sub-task 1.5 pattern** (Cowork-introduced 2026-05-23): When Day prompt requires new code that overlaps existing W1 stubs, insert "reconcile plan REPORT ONLY" sub-task before any implementation. Empirically verify caller inventory + test impact + reconcile option (a/b/c). HALT for operator approval. Prevents Day 5a-style silent breaking changes.

Related: [[vault-sot-priority]] [[ao-5-vault-wins]] [[claude-code-cli-handoff-pattern]]
