# IPS Wizard — Product & Implementation Spec (v2 C3)

> **Status:** draft · **Branch:** `version/v2-engineering`  
> **Owner:** Principle bounded context · **Regulatory:** Strategic Decision 0 Option B  
> **References:**  
> - [`cohort-ideation-2026-06.md`](../handoff-20260611/cohort-ideation-2026-06.md) §2 원칙 수립  
> - [`cohort-profile-engine-design.md`](../handoff-20260611/cohort-profile-engine-design.md) §3 결과 → IPS CTA  
> - [`survey-merge-map.md`](../handoff-20260611/survey-merge-map.md) Q1·Q2·Q5·Q6 → IPS 입력  
> - Zod SoT: `src/domains/principle/domain/ips-schema.ts`

---

## 1. Purpose

**IPS (Investment Policy Statement)** = 사용자가 **평온할 때** 작성하는 본인 투자 원칙 문서.

Cohort는 IPS를 **추천·생성하지 않는다.** 위저드는 **질문 + 사용자 입력 + 확인**만 제공한다.

| 허용 | 금지 (Option B) |
|------|-----------------|
| "본인이 정한 손실 한계 %에 도달하면 **본인 plan**에 따라 검토" | "30% 비중으로 매수하세요" |
| 자산군 **% 목표** (사용자 입력) | 종목·섹터 추천 |
| 사전 서약문 **사용자 직접 작성** | AI가 규칙 문장 대신 작성 |

**Mascot:** Aurora 🕊 — onboarding·plan reference 톤 (차분, plan adherence).

---

## 2. Wizard flow (V2.0 — 6 steps)

| Step | ID | Title (KO) | Prefill from survey |
|------|-----|------------|---------------------|
| 1 | `horizon` | 투자 기간 · 목표 | `time_horizon` (Q1) |
| 2 | `allocation` | 목표 자산 배분 (%) | `portfolio_composition_pct` (Q2) optional |
| 3 | `loss_limit` | 손실 한계 · 검토 트리거 | — |
| 4 | `pace` | 추가 투자 페이스 | `split_buy_enforcement` (Q5) hint only |
| 5 | `rebalance` | 리밸런싱 규칙 | — |
| 6 | `review` | 평가 · 복기 주기 + 사전 서약 | `plan_formalization` (Q6) branch copy |

**Exit:** `IpsDocument` JSON 저장 → (future) `investment_principle` table · `profile_snapshot.linked_principle_id`.

**Mobile:** full-screen stepper, 44px+ touch, bottom-fixed CTA (41-interaction-patterns).

---

## 3. Data model (V2 draft — migration deferred)

```sql
-- C2+ migration (not in V2-003 scope)
create table investment_principle (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version int not null default 1,
  document jsonb not null,              -- IpsDocument (Zod-validated)
  acknowledged_at timestamptz not null default now(),
  superseded_at timestamptz,
  created_at timestamptz not null default now()
);
```

Until migration: validate with Zod on API; persist to `plan` JSONB on watchlist or temp store — **API route deferred to V2-004**.

---

## 4. Zod schema map

| Field | Type | Validation |
|-------|------|------------|
| `schemaVersion` | `'ips-v0.1'` | literal |
| `horizon.yearsBand` | enum | `lt_1y` … `gt_20y` |
| `allocation.targets` | `{ assetClass, weightPct }[]` | sum = 100 ± 0.01 |
| `lossLimit.maxDrawdownReviewPct` | number | 1–50 |
| `lossLimit.action` | enum | user review actions only |
| `pace.monthlyContributionBand` | enum | no KRW amounts in V1 |
| `rebalance.driftThresholdPct` | number | 1–25 |
| `rebalance.cadence` | enum | monthly … annual |
| `review.cadence` | enum | weekly … quarterly |
| `preCommitment.text` | string | 20–2000 chars, user-authored |

See TypeScript exports in `ips-schema.ts`.

---

## 5. UI components (future PRs)

| Component | Atomic | Path |
|-----------|--------|------|
| `IpsWizardShell` | organism | `src/components/ips/IpsWizardShell.tsx` |
| `AllocationStep` | molecule | % sliders, sum indicator |
| `PreCommitmentStep` | molecule | textarea + Aurora guard copy |

**Copy skill:** all labels through cohort-ux-copy · Option B scan in CI.

---

## 6. API (deferred V2-004)

| Method | Path | Body |
|--------|------|------|
| POST | `/api/principle/ips` | `IpsDocument` |
| GET | `/api/principle/ips` | latest active document |

Server-only validation: `parseIpsDocument()`.

---

## 7. Acceptance criteria (C3)

- [x] Spec document (this file)
- [x] Zod schema + unit tests green
- [ ] UI stepper (V2-005)
- [ ] DB migration + API (V2-004)
- [ ] Link from profile result screen CTA

---

## 8. Open questions for Ray

| # | Question | Default if silent |
|---|----------|-----------------|
| Q1 | 월 투자 한도 — **% 밴드** vs **절대 금액**? | **% 밴드 only** (PIPA) |
| Q2 | Q2 실제 배분 vs IPS 목표 배분 **불일치 경고** 표시? | Yes — drift education only |
| Q3 | 사전 서약 **필수** vs optional? | Required on step 6 |
