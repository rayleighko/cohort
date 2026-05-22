---
name: polar-payment-architecture
description: Polar (MoR) replaces Toss — USD billing, externalCustomerId=user_profile.id, service-role admin client for subscription.* webhook events
metadata:
  type: project
---

Payment provider pivoted Toss → Polar 2026-05-21 (Day 3) because Toss requires 사업자 등록 + tax compliance review (incompatible with solo founder + 5-week cap). Polar handles MoR + global tax.

**Architecture**:
- **Currency**: USD only V1. $19 Pro / $59 Premium. KRW Toss deferred to Sprint 1+ (post 사업자 verification).
- **Customer mapping**: Polar `externalCustomerId` = Supabase `user_profile.id` (UUID). SDK field is `externalCustomerId` (not `customerExternalId` — common transposition error).
- **Webhook**: `standardwebhooks` validateEvent for mandatory signature verify. `subscription.active/updated/canceled` events → update `user_profile.current_tier` via **service-role admin client** (`src/lib/supabase/admin.ts`), NOT user-context client (no INSERT policy by design).
- **Provider-agnostic gating**: `src/lib/payment/tier-gating.ts` `requireTier` server guard. Trial → pro within trial window. Shape A/B/C Pro-gated → `/settings#upgrade`.
- **Bundle hygiene**: Split `polar/client.ts` (server-only SDK) from `polar/plans.ts` (client-safe config). Day 3 caught 52kB bloat → fixed to 2.41kB.

**Migrations**: 0002_polar_columns.sql adds `polar_customer_id`, `polar_subscription_id` to user_profile (idempotent `ADD COLUMN IF NOT EXISTS`).

**Vault drift (W2 batch cleanup)**: 00 / 23 / 25 / 31 + CLAUDE.md Stack line still reference Toss. Fix in W2.

**W5 prereq**: PIPA 즉시 삭제 must purge polar_* columns + Polar API customer delete.

Related: [[postgres-migration-history]]
