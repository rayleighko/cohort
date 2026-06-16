# Work Journal — 2026-06 V1 Ship

## Meta

| Field | Value |
|-------|-------|
| Version doc | `docs/versions/v1-main/` |
| Git branch | `main` |
| Period | 2026-06-01 → ongoing |
| Lead | Ray |

---

## Goals (start)

- [x] Macro freshness (KST, dynamic dashboard)
- [x] Aurora briefing visible + archive fallback
- [x] Support-tier reframing (features public)
- [x] Privacy/Terms Korean pages
- [ ] Landing redirect (logged-in first visit → dashboard) — coded, pending merge
- [ ] GitHub CI
- [ ] Task 5 `scoreGlRts` Green

---

## Timeline (chronological)

| Date | Event | Notes |
|------|-------|-------|
| 2026-06 | Macro stale fix | Removed ISR mindset; `force-dynamic`, 15m cache |
| 2026-06 | Cron rename | `cohort-shape-c-triggers` — macro **not** cron-driven |
| 2026-06 | Tier gating removed | `requireTier` no longer redirects |
| 2026-06 | Docs handoff batch | portfolio-tool-roadmap, AGENT-QUEUE |
| 2026-06-12 | Architecture docs split | versions/ + engineering/ + journal structure |
| 2026-06-12 | Middleware landing pass | `cohort-landing-pass` session cookie |

---

## Done

- ECOS/FRED snapshot with observation dates + 7d delta labels
- Aurora narration `asOfDate` cache + stale archive UX
- Shape C cron path + tests renamed
- Footer legal links; subscription as project support
- `docs/architecture-system-design.md` (deep dive + interview Q&A — **not** in README)

---

## Missed / deferred

- GitHub Actions CI (`.github/` missing)
- E2E Playwright config
- Chart/time-series UI phase
- Toss lab local routes
- Cloud Agent overnight runs (cost)
- Production verify: `ANTHROPIC_API_KEY` on Vercel for live narration

---

## Should have considered earlier

- Document **directory-first versioning** before multi-agent parallel burst (integration tax)
- Single doc index (`docs/README.md`) at W3
- Docker compose for local Postgres before migration-heavy v2

---

## Bottlenecks discovered

| Area | Symptom | Root cause | Mitigation |
|------|---------|------------|------------|
| Macro | “Stale” dashboard | UTC dates + long ISR/cache | KST helpers + dynamic pages |
| Aurora | Empty brief block | Strict date match + collapsed `<details>` | Fallback latest + `open` on dashboard |
| Agents | Merge pain | Many parallel branches | v2 harness: max 2 agents, PR to version branch |
| Narration prod | 503 | Missing env on Vercel | Checklist in observability.md |

---

## Incidents (prod / staging)

### 2026-06 — Aurora 503 on production

- **Symptom:** Brief generation fails for users
- **Cause:** Server env / API key / Supabase admin path
- **Fix:** Verify Vercel env + admin client routes
- **Metric we should have watched:** Sentry rate on `/api/aurora/narration`

---

## Agent / PR notes

| PR | Agent | Merge? | Integration issues |
|----|-------|--------|---------------------|
| (local) | Cursor | pending | middleware + Footer + docs batch |

---

## Learnings (for interview / retro)

1. **Cron scope clarity:** Shape C only — explaining this prevents wrong “refresh macro” ops fixes.
2. **Option B + support tiers:** Decouple revenue from feature gates early to reduce product/code drift.
3. **Agent parallelism:** Branch-per-task works with **merge order** and **file domain** limits — not eight open PRs.

---

## Next period handoff

- **Phase 0 close-out** on `main` — see [`docs/engineering/phase-0-closeout.md`](../engineering/phase-0-closeout.md)
- Then `version/v2-engineering` branch
- Founder Q1–Q4 closed 2026-06-12 → [`founder-interview-log.md`](../engineering/founder-interview-log.md)
