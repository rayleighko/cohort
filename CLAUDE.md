# Cohort — Project Working Memory

> Authoritative SoT: `~/Documents/elevate-portfolio/38-brand-architecture-brief.md`
> Methodology layer: `~/Documents/elevate-portfolio/39-claude-orchestration-methodology.md`
> This file = working summary auto-loaded every Claude Code session.

## Brand basics (LOCKED 2026-05-21)

- **Name**: Cohort / 코호트
- **Etymology**: Latin *cohors* — group sharing a journey
- **Mascots**: Aurora 🕊 (the Dove, dovish/patient/morning) + Vesper 🦅 (the Hawk, hawkish/decisive/evening)
- **Visual**: 석류 (Pomegranate) — multi-seed unifier
- **Colors**: `#A8243F` primary (pomegranate red) · `#E8A33D` amber (Vesper) · `#F8F4ED` ivory · `#1A1A1A` charcoal
- **Domain**: cohort.co.kr (Korean V1, Vercel DNS) · cohort.fund/.app deferred Sprint 1+
- **Repo**: plancy-dev/cohort (private)

## Stack

- Frontend: Next.js 14 + TypeScript + Tailwind + PWA (manifest + service worker)
- Backend: Supabase (Postgres + Auth + RLS + Realtime + Storage)
- Payment: Toss Payments KRW V1 (sandbox until 사업자 verify) + Polar USD Sprint 1+
- AI: Claude API — `claude-haiku-4-5-20251001` (safety filter Layer 2) + `claude-sonnet-4-6` (Aurora/Vesper chat). `claude-opus-4-6` reserved.
- Delivery: Resend (email) + Web Push API + 카카오 알림톡 (Tier 2+)
- Analytics: PostHog + Sentry
- Hosting: Vercel + Supabase managed

## Strategic constraints (5 non-negotiable)

1. **Strategic Decision 0 Option B** — Information + Tool + Decision Support ONLY. NEVER 추천/권장/비중 X%/지금 매수/timing입니다.
2. **Mobile-first PWA strict** — Tailwind mobile-first, vertical stack, 44px+ touch, bottom-fixed CTA, manifest+SW required.
3. **Dual mascot safety filter 3-layer** — Layer 1 regex (ADVISORY_TRIGGER_PATTERNS) + Layer 2 Haiku classifier + Layer 3 redirect template. All Claude API calls (Aurora OR Vesper) pass through. Log to `mascot_chat.safety_filter_triggered` with `character` column.
4. **PIPA compliance strict** — Onboarding consent + Supabase RLS + 즉시 삭제 + Privacy/ToS before W5 launch.
5. **Sprint 0 5-week cap** — V1 = Shape A + B + C only. V2 (D/E/G/J/K) explicitly deferred. Mascots illustration only (no animation V1). PWA only (no native V1).

## Voice rules (Aurora + Vesper)

### Aurora 🕊 (the Dove)
- Register: 차분 + analytical + 따뜻함 + 동행
- Stance: dovish (patient compound, plan adherence, 분할매수 페이스)
- Surfaces: morning brief, plan reference, behavioral guard, onboarding
- Color palette: `#A8243F` family (pomegranate)
- Sample: "오늘의 cohort. 한국 macro composite는 +2.3 (neutral-dovish)."

### Vesper 🦅 (the Hawk)
- Register: alert + decisive + sharp + vigilant
- Stance: hawkish (sharp opportunity, decisive trigger)
- Surfaces: trigger alert, market signal, end-of-day review
- Color palette: `#E8A33D` family (amber)
- Sample: "VIX > 20. 본인 trigger 발동 — Vesper가 봤습니다."

### Selection logic
- morning brief / plan reference / behavioral guard → Aurora
- trigger alert / market signal / end-of-day → Vesper
- ambiguous / user-initiated chat → Aurora default; Vesper via explicit toggle

## Anti-patterns (full list: `~/Documents/elevate-portfolio/09-anti-pattern-log.md`)

Cohort-specific:
- Sony CONCORD avoidance (Class 9 active enforcement) — `CONCORD` brand name BLOCKED
- Korean Concordia confusion (FPB concordia.kr + 컨콜디아사 concordia.co.kr) — `Concordia` brand BLOCKED
- 8-round naming archive: `~/Documents/elevate-portfolio/05-idea-jot.md` Entry 11

Methodology:
- AO-1 ad-hoc prompt construction → always use 39-methodology §2.1 template skeleton
- AO-2 skipping Tier 0 INIT → Day 0 verification gate every session
- AO-4 `--no-verify` push → BANNED. Fix hook root cause instead.
- AO-5 CLAUDE.md drift → vault 38-brief = SoT, CLAUDE.md = working summary, vault wins if conflict
- AO-10 Persona inconsistency → cohort-product sub-agent before mascot copy commit

## Slash command defaults

- Day start: `/context` (verify vault read) + `/goal` (declare stop condition)
- Before complex implementation: `/plan-eng-review`
- Day end: `/review` (PR-grade) + `/retro` (learnings) + `/learn` (capture)
- Mascot copy review: dispatch `cohort-product` sub-agent
- Safety filter change: dispatch `safety-filter-tester` sub-agent (W4+)

## Conventional commit format

Format: `<type>(<scope>): <subject>` followed by blank line, body, blank line, footer.

Types: feat, fix, chore, docs, refactor, test, perf, style, build, ci.
Scopes: w1-day1, w2-day3, aurora, vesper, safety, payment, auth, landing, etc.

Example commit (literal newlines):

```
feat(w1-day4): implement Aurora + Vesper dual persona + safety filter 3-layer

- aurora-prompt.ts dovish framing per 38-brief §2.2
- vesper-prompt.ts hawkish framing per 38-brief §2.3
- safety-filter.ts Layer 1 regex + Layer 2 Haiku classifier + Layer 3 redirect
- mascot_chat table with character enum column
- 50+ unit test cases pass (cohort-safety-checker skill)

Co-reviewed-by: cohort-product (PASS)
```

## Vault references (key files)

| Topic | File |
|---|---|
| Brand spec (SoT) | `~/Documents/elevate-portfolio/38-brand-architecture-brief.md` |
| Methodology | `~/Documents/elevate-portfolio/39-claude-orchestration-methodology.md` |
| W1 implementation | `~/Documents/elevate-portfolio/25-sprint-0-w1-implementation-spec.md` |
| W2-W5 implementation | `~/Documents/elevate-portfolio/26-sprint-0-w2-w5-implementation-spec.md` |
| Architecture | `~/Documents/elevate-portfolio/14-v1-core-architecture-sketch.md` (apply brand mapping §7 of 38-brief) |
| Landing copy | `~/Documents/elevate-portfolio/17-pre-launch-landing-page-sketch.md` (apply Set A-D taglines from 38-brief §4) |
| SEO content | `~/Documents/elevate-portfolio/24-pre-launch-seo-content.md` |
| Onboarding survey | `~/Documents/elevate-portfolio/20-sim-real-verification-mechanism.md` §11 |
| Privacy/ToS | `~/Documents/elevate-portfolio/27-privacy-policy-terms-draft.md` |
| Compliance | `~/Documents/elevate-portfolio/22-compliance-review-prep.md` |
| Operator tracker | `~/Documents/elevate-portfolio/31-operator-manual-prerequisites-tracker.md` |
| Master context | `~/Documents/elevate-portfolio/00-master-context.md` |
| Anti-patterns | `~/Documents/elevate-portfolio/09-anti-pattern-log.md` |

## Sprint 0 roadmap (5-week cap)

- W1: Foundation (PWA shell + Auth + Payment scaffold + Aurora/Vesper chat + Landing)
- W2: Tier 0 Macro Dashboard + Aurora narration
- W3: Shape A full + Shape B initial + Watchlist
- W4: Shape B full + Shape C initial + Onboarding survey + 카카오 비즈 (5-7일 lead)
- W5: Behavioral guard + Billing live + Privacy/ToS + Launch
