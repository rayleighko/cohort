---
description: Verify Cohort vault SoT + CLAUDE.md + memory load at session start (Tier 0 INIT step 1)
allowed-tools: Read, Glob, Bash
---

You are starting a new Cohort work session. Before any code change, verify context is loaded:

1. **Read CLAUDE.md** at `~/Development/cohort/CLAUDE.md` (project working memory).
2. **Read MEMORY.md** at `~/Development/cohort/.claude/memory/MEMORY.md` (memory index). Follow links for any memory file relevant to the requested task.
3. **Vault SoT files** to glance at:
   - `~/Documents/elevate-portfolio/38-brand-architecture-brief.md` (brand)
   - `~/Documents/elevate-portfolio/39-claude-orchestration-methodology.md` (process)
   - `~/Documents/elevate-portfolio/40-design-system-architecture.md` (design master)
   - The W-specific implementation spec (`25-sprint-0-w1-implementation-spec.md` for W1, `26-sprint-0-w2-w5-implementation-spec.md` for W2+).
4. **Brand mapping confirmation** — explicitly state:
   - Aurora 🕊 = dovish/patient, Vesper 🦅 = hawkish/decisive
   - Strategic Decision 0 = Option B (Information + Tool + Decision Support; NEVER 추천/권장/timing)
   - Mobile-first PWA strict
   - PIPA strict
   - Sprint 0 5-week cap

Output a single line confirming each item PASS/FAIL. If any FAIL, HALT and ask user.
