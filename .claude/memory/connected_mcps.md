---
name: connected-mcps
description: MCP server inventory — PostHog (underused), scheduled-tasks, computer-use, Claude-in-Chrome, mcp-registry; W2+ activate PostHog
metadata:
  type: reference
---

MCP servers connected to this Cowork session (as of 2026-05-22):

| MCP | Status | W2+ plan |
|---|---|---|
| **PostHog** (id 720afc44-...) | Connected, **underutilized** | W2 Day 1: dashboard-create + insight-create × 5 via MCP. W3+: feature-flag wrap of Shape A/B/C gates. W4: survey-create for NPS. |
| **scheduled-tasks** | Available, **unused** | W2 Day 1+: Aurora morning brief draft generator (07:00 KST). W2 Day 3+: W-progress digest (Sunday 21:00). |
| **computer-use** | Available | As needed for native app workflows |
| **Claude-in-Chrome** | Available | Browser-based research, PostHog UI checks |
| **mcp-registry** | Available | Search for new MCPs to add (ECOS/FRED don't have MCPs as of cutoff) |
| **cowork** (artifacts, file delete, directory access) | Available | W2+: Sprint progress board artifact, anti-pattern log live view, mascot voice consistency monitor |

**Day 6 (W2 Day 1) MCP usage planned**:
- `mcp__720...__dashboard-create` → "Cohort Sprint 0 KPI" dashboard
- `mcp__720...__insight-create` × 5 → waitlist signup count, mascot chat turns, safety filter trigger rate, /shape-a /shape-b /shape-c visit count, onboarding funnel
- `mcp__scheduled-tasks__create_scheduled_task` → "Aurora morning brief draft" cron 0 7 * * * (KST equivalent)
