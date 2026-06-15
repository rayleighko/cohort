# Task 5 — Scoring engine explained (for Ray)

> Plain-English guide to `scoreGlRts`, `toKofiaBand`, and `classifyBit`.
> **You type the Green implementation** — the agent only wrote Red tests + this doc.

---

## What problem does this solve?

After the user completes the 24-step survey, we store raw answers in `gl_rts_answers` (JSON).
**Scoring turns those answers into numbers** the app can use later:

| Function | Output | Used for |
|----------|--------|----------|
| `scoreGlRts(answers)` | **13–47** integer | Risk tolerance score (Grable-Lytton scale) |
| `toKofiaBand(score)` | **1–5** | Maps to 금투협-style bands (안정형 → 공격투자형) |
| `classifyBit(score, biasScores)` | BIT type | 등대/물결/나침반/불꽃 personality type (needs bias 8Q later) |

Nothing is shown on the landing page yet — scoring runs **server-side only** after survey submit.

---

## Task 5a — `scoreGlRts` (your job now)

**File:** `src/lib/profile/score-gl-rts.ts`  
**Tests:** `src/lib/profile/__tests__/score-gl-rts.test.ts` (11 failing = Red, target 16/16 Green)  
**Scoring key SoT:** `docs/handoff-20260611/gl-rts-13-korean.md` + exported `GL_RTS_ITEM_SCORES`

### Rules (already in tests)

1. All **13 questions** required — missing → `GlRtsScoreError`
2. Invalid option (e.g. Q4=`d`, Q9=`c`) → `GlRtsScoreError`
3. **Sum** all item scores (Q9 and Q10 are separate items, **not averaged**)
4. Range **13** (all minimum) to **47** (all maximum)
5. Q12: `a=1, b=2, c=3` only — never 4 (handout typo)

### How to go Green

```bash
pnpm vitest run src/lib/profile/__tests__/score-gl-rts.test.ts
```

Implement `scoreGlRts()` — loop question ids, look up points in `GL_RTS_ITEM_SCORES`, sum, return.

**Do not** score on the client — API will call this later when we wire post-submit scoring.

---

## Task 5b — `toKofiaBand` (next, agent can write Red tests)

Maps GL-RTS total score → 5 bands (practical convention, not peer-reviewed cut scores):

| Score | Band | Label (approx) |
|-------|------|----------------|
| ≤18 | 1 | 안정형 |
| 19–22 | 2 | 안정추구형 |
| 23–28 | 3 | 위험중립형 |
| 29–32 | 4 | 적극투자형 |
| ≥33 | 5 | 공격투자형 |

Source: `gl-rts-13-korean.md` §채점 요약 (handout bands).

---

## Task 5c — `classifyBit` (later — needs bias 8 questions)

Uses GL-RTS quartile + emotional/cognitive bias scores → one of 4 Pompian types:

- **등대** (Preserver) / **물결** (Follower) / **나침반** (Individualist) / **불꽃** (Accumulator)

Full design: `cohort-profile-engine-design.md` §2–3.  
Bias 8Q is **deferred** — `classifyBit` Red tests can wait until those questions exist.

---

## Related docs (read order)

1. `gl-rts-13-korean.md` — question text + per-item points
2. `survey-merge-map.md` — what the survey collects today
3. `cohort-profile-engine-design.md` — ProfileEngine big picture
4. `survey-funnel-posthog-spec.md` — analytics (no score in events — PII-safe)

---

## FAQ

**Q: Why Red tests fail?**  
A: `scoreGlRts()` still throws `Not implemented`. That's intentional TDD Red.

**Q: Is this deployed on cohort.co.kr?**  
A: Survey UI existed in code but was **not wired to onboarding** until the next integration commit. Landing stays waitlist-only by design (Phase 0 acquisition).

**Q: Who commits Green?**  
A: You — handoff rule: core scoring logic is Ray-typed.
