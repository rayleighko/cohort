---
description: Architecture sketch + sub-agent review before non-trivial implementation
allowed-tools: Read, Glob, Grep, Bash, Task
---

For non-trivial implementation (>3 files touched, new external integration, new architectural pattern, security-sensitive change):

1. **Sketch architecture** (5-10 bullets):
   - What new files/modules are created or modified?
   - What new external dependencies (API, MCP, library)?
   - What new database tables/columns/policies?
   - What is the failure mode and retry/fallback strategy?
   - What is the test strategy?
   - What is the rollback path?

2. **Dispatch sub-agents in parallel** for review (use Task tool):
   - `engineering:architecture` for ADR-grade trade-off analysis (if architectural pattern is novel)
   - `engineering:system-design` for API/data model review (if surface area is large)
   - Project-local agents (`cohort-design-system`, `cohort-accessibility-auditor`) for any UI touch

3. **HALT and report** the sketch + reviews to the user. Do NOT implement until user confirms.

This command is mandatory before any change that adds: new Supabase tables, new external API integration (ECOS/FRED/DART/Polar/Resend/etc.), new safety filter pattern, new payment flow, new authentication path.
