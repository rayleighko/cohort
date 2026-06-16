# Agent Harness — Sub-agents, Branches, PR, Merge

> **Verdict:** Sub-agent-per-branch + PR + central review is **methodologically sound** for Cohort **if** you accept **integration tax** and constrain parallelism.  
> It mirrors async open-source maintainership ([Marc Nuri 2025](https://blog.marcnuri.com/boosting-developer-productivity-ai-2025)) and production patterns (worktree isolation — [Augment Code](https://www.augmentcode.com/guides/git-worktrees-parallel-ai-agent-execution)).

---

## Recommended model for solo founder + agents

| Role | Who | Responsibility |
|------|-----|----------------|
| **Orchestrator** | Ray or lead Cursor session | Scope, merge order, founder interviews |
| **Implementer** | Sub-agent / Cloud Agent / Composer | One `feat/v2-*` branch, one concern |
| **Verifier** | CI + `cohort-design-system` + `cohort-accessibility-auditor` + `cohort-product` | Parallel on PR |
| **Merger** | Human (Ray) | Approve PR; never blind merge |

**Default parallelism:** **2 agents max** on non-overlapping file domains. **1 agent** when touching `middleware`, `safety-filter`, or migrations.

---

## Workflow (operational)

1. **Spec first** — Update `docs/versions/v2-engineering/` or issue stub; interfaces in PR description.
2. **Branch** — `git worktree add ../cohort-feat-003 -b feat/v2-003-ips-wizard main` (optional isolation).
3. **Implement** — Sub-agent prompt lists **allowed files only** (existing discipline).
4. **PR** — To `version/v2-engineering`, not `main`. Template:

   ```markdown
   ## Scope
   - feat/v2-003: IPS wizard step 1

   ## Docs
   - docs/versions/v2-engineering/ARCHITECTURE.md (if arch change)

   ## Verification
   - [ ] npx tsc --noEmit
   - [ ] npx vitest run <paths>
   - [ ] Co-reviewed-by: cohort-design-system, cohort-accessibility-auditor

   ## Journal
   - Will append journal/2026-06-v1-ship/JOURNAL.md on merge
   ```

5. **Review** — Ray or `@Code-reviewer` equivalent; fix before merge.
6. **Merge** — Squash preferred for agent PRs (clean history).
7. **Journal** — Append § Done / Missed / Bottleneck to active `JOURNAL.md`.

---

## When **not** to branch per agent

- **Hotfix production** — single branch `fix/*` from `main`, one agent, fast merge.
- **Trivial copy** — commit on version branch directly if <20 lines and no logic.
- **Exploratory spike** — time-boxed branch; delete if throwaway (worktree delete pattern).

---

## Integration tax mitigation

From industry reports (2025–2026):

| Problem | Mitigation |
|---------|------------|
| 4+ open PRs, merge conflicts | Max 2 parallel; merge daily |
| Duplicate implementations | Shared `CLAUDE.md` + version ARCHITECTURE.md as contract |
| Phantom dependencies | Merge **foundation first** (migrations → domain → UI) |
| Agent drift from spec | Spec-Driven: PR must link doc section |
| Silent file overwrite | Git worktrees per agent |

---

## Cohort-specific agent roster

| Agent | Trigger |
|-------|---------|
| `cohort-design-system` | UI / Tailwind / tokens |
| `cohort-accessibility-auditor` | UI surfaces |
| `cohort-product` | Mascot / Option B copy |
| `safety-filter-tester` | `safety-filter.ts` changes |
| CI (future) | Every PR |

---

## Loop / harness engineering (project fit)

- **Outer loop:** Roadmap (`portfolio-tool-roadmap`) → version branch → journal retrospective.
- **Inner loop:** TDD red-green on domain modules (`tdd-ddd-playbook.md`).
- **Verification loop:** PR checks + sub-agents before merge (Zenflow-style spec → verify, adapted for Cohort scale).

No separate “harness repo” V1 — harness = **docs + CI + branch rules + journal** in this repo.

---

## Anti-patterns (AO)

- AO-3: Sequential review agents when parallel eligible → **parallel dispatch**.
- AO-4: `--no-verify` → fix hooks.
- Eight agents, one merge weekend → **avoid** unless release freeze dedicated.
