# Landing V-C — Component Spec

**Atomic level**: page (40-design-system §3.5)
**File path**: `src/app/page.tsx`
**Used by**: `/` route (public, pre-launch)
**Status**: in-implementation (W1 Day 5b)
**Last updated**: 2026-05-22

**Related**: 40-design-system-architecture · 41-interaction-patterns · 42-typography-color-system · 17-pre-launch-landing-page-sketch §13 · 38-brand-architecture-brief §4

---

## 1. Purpose

목적: 사전 신청(waitlist) 전환을 위한 pre-launch 랜딩. Top 5-10% sophisticated
retail에게 Cohort = 정보 + 도구 + 의사결정 지원(Option B)임을 전달하고, Aurora /
Vesper 듀얼 마스코트를 소개한다.

Purpose: pre-launch landing optimized for waitlist conversion; communicates the
Option-B positioning (information + tool + decision support, never advisory) and
introduces the Aurora/Vesper dual mascot.

---

## 2. Structure (Version C)

| Section | Content | Source |
|---|---|---|
| Header | Aurora + Vesper avatars + `Cohort` wordmark | — |
| Hero | Set A tagline "본인 plan과 cohort — 흔들리지 않는 페이스." + sub | 38-brief §4 Set A |
| 석류 visual | pomegranate cross-section icon + caption | 38-brief §3 |
| Value prop ×3 | 정보 / 도구 / 의사결정 지원 cards | Option B framing |
| Mascot duality | Set D — Aurora 새벽 / Vesper 결정 | 38-brief §4 Set D |
| Tier preview | Tier 0 무료 / Pro $19월 (single line, no table) | — |
| Disclaimer footer | `<DisclaimerFooter />` (자본시장법) | 14-arch §14.4-pre |
| Bottom-fixed CTA | "사전 신청하기 (무료)" → `/waitlist` | — |

---

## 3. States

| State | Behavior |
|---|---|
| mount | Hero fades in (opacity, `duration-slow`); `landing_view` PostHog event fires |
| scroll | Below-fold sections scroll-fade in (IntersectionObserver, threshold 0.25) |
| CTA hover/active | `bg-cohort-primary` → `bg-aurora-concerned`, `duration-fast ease-out` |
| reduced-motion | all fades instant (`motion-reduce:` — opacity 1, no translate) |

---

## 4. Accessibility (WCAG 2.1 AA)

- **Contrast**: `text-cohort-ink-90` on ivory ~16:1, `ink-70` 9.4:1, `ink-50` 4.6:1 (caption only) — all pass. CTA `text-cohort-ivory` on `bg-cohort-primary` ~7:1.
- **Touch target**: bottom-fixed CTA `min-h-[52px]` (> 44px).
- **Bottom-fixed**: `pb-[calc(env(safe-area-inset-bottom)+12px)]` safe-area accommodation.
- **Semantic HTML**: `<main>`/`<header>`/`<section>`/`<article>`/`<h1>`/`<h2>`; CTA is a real `<Link>` (anchor).
- **Reduced-motion**: every fade has `motion-reduce:` instant fallback.
- **Korean text**: `break-keep` on the root container.
- **Image**: 석류 `<Image>` has descriptive Korean `alt`.

---

## 5. Mascot integration

- **Characters**: Aurora 🕊 + Vesper 🦅 (both — duality intro is the point).
- **State**: `calm` (default) for all avatars — pre-launch marketing surface, no live state.
- **Voice**: landing copy is Aurora-leaning calm/동행 register; Vesper referenced descriptively. Neutral for tier/CTA labels.
- Mascot copy reviewed by `cohort-product` sub-agent.

---

## 6. Copy guidelines

Option B strict — no 추천/권장/지금 매수. Hero explicitly states "추천도, 권장도
하지 않습니다". Value-prop card 3 ("의사결정 지원") ends "결정은 늘 본인의 몫".
Korean primary; English fallback deferred to Sprint 1+ (영문 landing).

---

## 7. Mobile behavior + responsive

- **Mobile (< sm)**: single column, `max-w-md`, vertical stack; hero `text-3xl`.
- **sm: (≥640px)**: hero `text-4xl`.
- **lg: (≥1024px)**: hero `text-5xl`.
- Bottom-fixed CTA full-width within `max-w-md`.

---

## 8. Token sourcing checklist

- [x] Colors: `text-cohort-ink-90/70/50`, `text-cohort-primary`, `bg-cohort-ivory`, `bg-white`, `bg-cohort-primary`, `border-cohort-ink-10`, `bg-aurora-concerned`
- [x] Typography: `text-3xl/4xl/5xl/xl/lg/base/sm` + `font-extrabold/bold/semibold`
- [x] Shadow: `shadow-mascot-aurora` (CTA), `shadow-sm` (cards)
- [x] Radius: `rounded-lg`
- [x] Transition: `duration-fast/slow` + `ease-out`
- [x] All Day 5a tokens — no raw hex/px

---

## 9. Implementation notes

- `src/app/page.tsx` — `'use client'` (PostHog events + IntersectionObserver + cookie read).
- PostHog: `landing_view` on mount, `cta_click` on CTA tap (anonymous, ab_variant only — no PII).
- `Reveal` wrapper component (in-file) = scroll-fade pattern #8.

---

## 10. Anti-patterns avoided

- No comparison table (tier preview = single line; W2+).
- No parallax / confetti (microinteraction MI-2/MI-1).
- No advisory copy (Option B).
- No `text-5xl` mobile baseline (mobile-first ramp).

---

## Update log

- 2026-05-22: spec created — W1 Day 5b Landing V-C implementation.
