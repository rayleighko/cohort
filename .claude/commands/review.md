---
description: PR-grade code review before push (Day-end gate)
allowed-tools: Read, Glob, Grep, Bash, Task
---

Run PR-grade review before `git push`. Dispatch in parallel:

1. **`engineering:code-review` skill** — security, performance, correctness, error handling, edge cases
2. **`engineering:testing-strategy`** — test coverage check; missing test cases for new code
3. **Project-local sub-agents** (if applicable):
   - `cohort-product` — Aurora/Vesper voice consistency + Option B in any user-facing copy
   - `cohort-design-system` — token/spacing/typography consistency for any UI change
   - `cohort-accessibility-auditor` — WCAG 2.1 AA for any UI change
   - `safety-filter-tester` — red-team if safety-filter.ts touched

4. **HALT** on any CRITICAL finding. Fix root cause (do NOT use `git push --no-verify` — see memory: no_no_verify.md).

5. **PASS conditions** — all reviewers PASS or PASS-with-explanation (documented in commit message).

Output: structured pass/fail report per reviewer, then either "READY TO PUSH" or "BLOCKED: <reason>".
