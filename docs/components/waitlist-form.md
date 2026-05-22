# Waitlist Form — Component Spec

**Atomic level**: page (40-design-system §3.5)
**File path**: `src/app/(marketing)/waitlist/page.tsx`
**Used by**: `/waitlist` route (public, pre-launch); reached from Landing V-C CTA
**Status**: in-implementation (W1 Day 5b)
**Last updated**: 2026-05-22

**Related**: 40-design-system-architecture · 41-interaction-patterns §8 (form) · 42-typography-color-system · 20-sim-real-verification §11.8 (PIPA)

---

## 1. Purpose

목적: pre-launch 사전 신청 이메일 수집. PIPA 필수 동의 + 선택 마케팅 동의 후
`/api/waitlist`에 제출, launch 알림 명단에 등록한다.

Purpose: collect pre-launch waitlist emails with explicit PIPA consent; posts to
`/api/waitlist` (service-role insert + Resend confirmation + server PostHog event).

---

## 2. Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| email | `<input type=email>` | ✓ | `autoComplete="email"`, `inputMode="email"`, real `<label>` |
| consent_pipa | checkbox | ✓ | 수집 항목/목적/보유(90일)/삭제 path stated inline |
| consent_marketing | checkbox | — | optional; launch 후 안내 |

Submit disabled until `email` non-empty AND `consent_pipa` checked.

---

## 3. States

| State | UI |
|---|---|
| idle | form |
| submitting | submit button "신청 중…", disabled |
| subscribed | success screen — Aurora `happy` avatar + 이메일 확인 안내 + 홈 link |
| already | gentle "이미 신청된 이메일이에요" screen (NOT an error) + 홈 link |
| error | inline `role="alert"`, `text-cohort-warning` + ⓘ icon + recovery hint |

Error copy (cohort-ux-copy, Aurora tone): 형식 오류 → "이메일 형식을 다시
확인해주세요"; 네트워크 → "연결에 문제가 생겼어요"; 서버 → "잠시 후 다시".

---

## 4. Accessibility (WCAG 2.1 AA)

- Real `<label htmlFor>` for email (not placeholder-only) — 41 §8 F-1.
- Checkbox rows are `<label>`-wrapped, `min-h-[44px]` touch target.
- Submit `min-h-[52px]`; cancel `min-h-[44px]`.
- Error: `role="alert"` + color (`cohort-warning`) + ⓘ icon + text — color-blind safe (41 §6.3).
- `autoComplete="email"` on the PII field (PIPA — 41 §8.4 F-4).
- `break-keep` on the root container; bottom-fixed submit has safe-area-inset.

---

## 5. Mascot integration

Success state shows Aurora 🕊 (`happy` state) — onboarding/confirmation surface
is Aurora context (38-brief §2.4). No Vesper.

---

## 6. Copy guidelines

Option B strict. Consent copy states retention (90일) + 삭제 path. Success copy
is calm confirmation ("launch 소식을 가장 먼저") — no celebration (40 §6.3).

---

## 7. Mobile behavior

Single column, `max-w-md`. Bottom-fixed submit + cancel, safe-area-inset. No
responsive table. Same layout sm→2xl (form is intrinsically narrow).

---

## 8. Token sourcing checklist

- [x] Colors: `text-cohort-ink-90/70/50`, `bg-cohort-ivory`, `bg-cohort-primary`, `border-cohort-ink-10`, `text-cohort-warning`, `accent-cohort-primary`
- [x] Type: `text-2xl/base/sm` + `font-bold/semibold/medium`
- [x] Radius: `rounded-lg` · Transition: `duration-fast ease-out`
- [x] No raw hex/px

---

## 9. Implementation notes

- `'use client'` — form state + fetch + PostHog distinct_id read.
- POST `/api/waitlist` body: `{ email, consent_pipa, consent_marketing, ab_variant, distinct_id }`.
- `waitlist_submit` PostHog event fired SERVER-side by `/api/waitlist` (reliable) — not duplicated client-side.

---

## 10. Anti-patterns avoided

- No placeholder-only label (F-1). No onChange red-flash (blur/submit only).
- 중복 email = gentle state, not a harsh error (ST-2).
- Email never sent to PostHog (PIPA).

---

## Update log

- 2026-05-22: spec created — W1 Day 5b waitlist form.
