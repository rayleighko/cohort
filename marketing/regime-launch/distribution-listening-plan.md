# Bearings — Regime Read: Distribution & Listening Plan

Goal of this slice: **find out if the idea pulls**, cheaply, before building the
tool. Primary signal = qualitative pull (people asking to use it). The go/kill
line below is **pre-committed** — set it now, don't move it after seeing data.

Validation window: **14 days from the first post.**

---

## 1. Channels, order, cadence

Stagger over ~1 week so you can adapt the hook based on what lands. Don't blast
everything day one.

| Day | Channel | Asset | Link? |
|---|---|---|---|
| 1 | X/fintwit — the 10-tweet thread (PART 2B) | `assets/contrast-2008-vs-2022.png` on tweet 5–7; `regime-map.png` on tweet 10 | Yes, `thebearings.app` in final tweet |
| 1 | X — pin the thread | — | — |
| 3 | Reddit r/investing — discussion post (no link) | `regime-map.png` if images allowed | No (link in comment only if invited) |
| 5 | Reddit r/Bogleheads — calmer title variant | inline 60/40 math | No |
| 7 | Longform (PART 2A) as X long-post / Substack / personal blog | both cards | Yes |
| 8–10 | Optional: r/ValueInvesting, r/financialindependence reshare | — | No |

Rules of thumb: one primary post per day max; reply to every comment in the first
2 hours (drives reach); never argue, ask questions back (more comments = more reach
= more qualitative signal).

---

## 2. How to capture "qualitative pull" (so it's measurable, not vibes)

Keep one simple sheet (`pull-log`, any spreadsheet) with a row per signal:

`date | channel | handle | type | verbatim quote | target-fit? (y/n)`

Count something as a **pull signal** only if it's *unsolicited intent to use*:
- "when can I use this / how do I get it / is it live / DM me the link"
- "I'd pay for this", "this is exactly my problem"
- a DM asking for early access

Do **not** count generic "nice post / interesting / good viz" — that's reach, not pull.
Tag `target-fit = y` if the person looks like sophisticated retail (talks allocations,
holds individual positions, not a pure beginner or a bot).

PostHog already records the funnel: `regime_landing_view` → `waitlist_submit`
(`source='regime-landing'`). Pull those two numbers for the conversion rate.

---

## 3. Go / Kill / Iterate — pre-committed baseline

Decision is made at the end of the 14-day window, **only if a fair shot was given**
(fair shot = at least the Day 1–7 posts above actually shipped and reached
**≥ 2,000 total impressions**; if reach was below that, the test is inconclusive —
extend or repost, don't kill on no distribution).

### Primary gate — qualitative pull (this decides it)

| Band | Trigger (target-fit pull signals in 14 days) | Action |
|---|---|---|
| **GO** | **≥ 8** unsolicited "I want this" signals | Build the thin tool slice (manual tickers + weights) |
| **ITERATE** | **2–7** | Re-cut the hook/title once, re-test for one more week |
| **KILL / PIVOT** | **≤ 1** (despite ≥ 2,000 impressions) | Stop; the angle doesn't pull — rethink the wedge |

### Secondary guardrails (support the call, don't override the primary)

| Metric | GO | KILL |
|---|---|---|
| Waitlist signups (14d) | ≥ 50 | ≤ 10 |
| Conversion: landing view → signup (≥ 300 views) | ≥ 8% | < 3% |
| Breakout post | any single post ≥ 25k impressions (X) or ≥ 300 upvotes (Reddit) = standalone GO signal | — |

### Decision rule (how to combine)

1. **Qualitative is primary.** If pull says GO, proceed even if signup counts are
   modest — build cheaply (preset-portfolio slice first).
2. If pull says KILL, **kill/pivot even if a post went viral.** Vanity reach without
   "I want this" means the hook travels but the product doesn't.
3. If primary = ITERATE, use the guardrails to decide what to change: low conversion
   with decent reach → fix the landing/offer; low reach → fix distribution/hook.
4. A breakout post (guardrail row 3) upgrades ITERATE → GO on its own.

**Pre-commitment:** these numbers are set *before* data. Adjust them now if they
feel wrong — but once posting starts, the line holds. That's the whole point.

---

## 4. Before you post (checklist)

- [x] Numbers unified to total returns across thread, longform, Reddit, and both
      images: 2022 stocks −18.0% / bonds −17.8%; 2008 stocks −37% / bonds +20.1%.
- [ ] `thebearings.app` resolves to the `/regime` landing (DNS + Vercel domain live).
- [ ] OG card renders when you paste the link into X/Reddit (the share preview).
- [ ] `pull-log` sheet created and open.
- [ ] All numbers match across thread, longform, Reddit, and both images.
