---
name: postgres-migration-history
description: Cohort Supabase migrations — 0001 schema · 0002 polar_* · 0003 waitlist · idempotency + repair convention
metadata:
  type: reference
---

Migrations live in `~/Development/cohort/supabase/migrations/`. Applied via `supabase db push` (CLI) or SQL editor (manual emergency).

| File | Day | Content |
|---|---|---|
| 0001_initial_schema.sql | Day 2 | 9 tables (user_profile, mascot_chat with character enum + safety_filter_triggered + safety_filter_category, watchlist, plan, trigger_config, etc.) + 13 RLS policies |
| 0002_polar_columns.sql | Day 3 | `ADD COLUMN IF NOT EXISTS polar_customer_id, polar_subscription_id` (idempotent) |
| 0003_waitlist.sql | Day 5b | Waitlist table for pre-launch lead capture, RLS default-deny + service-role-only + consent_pipa literal-true |

**Convention**:
- All migrations idempotent (`IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` via DO block)
- If migration already applied via SQL editor before db push, use `supabase migration repair --status applied <N>` to reconcile history (don't re-run)
- Service-role bypass-RLS only for: user_profile upsert (no INSERT policy by design), webhook-driven subscription updates, waitlist inserts
- Never disable RLS

**Non-blocking follow-up (W2+)**: waitlist.ab_variant could be NOT NULL DEFAULT 'C'.

Related: [[polar-payment-architecture]]
