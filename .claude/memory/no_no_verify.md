---
name: no-no-verify
description: Never use `git push --no-verify` or `git commit --no-verify` — AO-4 banned; fix hook root cause instead
metadata:
  type: feedback
---

`--no-verify` flag for git commit/push is BANNED in Cohort project. AO-4 anti-pattern.

**Why**: Hooks exist for safety reasons (lint, test, format, brand voice, token check). Bypassing them defeats the safety net we explicitly designed. If a hook is failing, the right move is fix the underlying issue, not skip the check.

**How to apply**:
- If pre-commit hook fails → fix the lint/format/test issue, re-stage, commit normally.
- If pre-push hook fails → fix the code review issue, re-test, push normally.
- If hook itself is broken (false positive) → fix the hook script, commit that fix, then proceed.
- Never `git commit --no-verify` even "just this once" — it's a habit that compounds.

Related: [[claude-code-cli-handoff-pattern]]
