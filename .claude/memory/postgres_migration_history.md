---
name: postgres-migration-history
description: Cohort Supabase migrations 0001-0014 — schema · polar · waitlist · narration/chat · quota · profile · shape C · notifications · RLS hotfix · GL-RTS answers. Idempotency + repair convention
metadata:
  type: reference
  verified_at: 2026-06-11
---

Migrations live in `supabase/migrations/` (repo-relative). Applied via `supabase db push` (CLI) or SQL editor (manual emergency).

2026-06-11: 0001→0013 applied in order to fresh Supabase project `wyjudyyrxgaccnghshkb` with zero edits (full-sequence verification). Note: 0001·0007 are NOT idempotent on re-run (duplicate policy errors) — single-run only.

| File | Day | Content |
|---|---|---|
| 0001_initial_schema.sql | Day 2 | 9 tables (user_profile, mascot_chat with character enum + safety_filter_triggered + safety_filter_category, watchlist, plan, trigger_config, etc.) + 13 RLS policies |
| 0002_polar_columns.sql | Day 3 | `ADD COLUMN IF NOT EXISTS polar_customer_id, polar_subscription_id` (idempotent) |
| 0003_waitlist.sql | Day 5b | Waitlist table for pre-launch lead capture, RLS default-deny + service-role-only + consent_pipa literal-true |
| 0004_aurora_narration_log.sql | W2 Day 4 / Day 9 | aurora_narration_log — persists Aurora narration across 4 categories (W4 chat history prereq) |
| 0005_aurora_chat.sql | W3 Day 1 / Day 11 | aurora_chat — multi-turn chat persistence, W5 Day 4 spec scaffold pull-forward (26-spec line 513-524) |
| 0006_chat_quota_usage.sql | W3 Thu / Day 13 | chat_quota_usage — per-tier daily message quota, enforced BEFORE Claude call (cost + abuse cap) |
| 0007_user_investment_profile.sql | W3 Fri | user_investment_profile — Survey 10Q + Q0 narrow filter + classification output (vault 61 v2 D4+D16, 53 §1.3.2) |
| 0008_shape_c_triggers.sql | W4 | shape_c_triggers — documents table already applied to remote (condition_params JSONB NOT NULL DEFAULT '{}') |
| 0009_behavioral_event.sql | W4 Wed | behavioral_event log (vault 62 §2, 56 D9) |
| 0010_notification_log.sql | W4 Thu | notification_log — audit + retry tracking (4-category routing, 2-track delivery) |
| 0011_user_notification_preference.sql | W4 Thu | user_notification_preference — channel opt-in + quiet hours (PIPA opt-in) |
| 0012_aurora_narration_log_anon_select.sql | W5 Wed | aurora_narration_log anon SELECT policy + table separation contract (D25 archive fallback) |
| 0013_user_profile_insert_rls.sql | W5 Wed Hotfix #7 | user_profile INSERT RLS policy + UPDATE WITH CHECK 강화 (onboarding 동의 저장 403 root cause) |
| 0014_profile_gl_rts_answers.sql | 2026-06-11 Task 4 | user_investment_profile — `gl_rts_answers JSONB`, `profile_version` default `glrts-ko-v0.1` (채점은 Task 5) |

**Convention**:
- All migrations idempotent (`IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` via DO block)
- If migration already applied via SQL editor before db push, use `supabase migration repair --status applied <N>` to reconcile history (don't re-run)
- Service-role bypass-RLS only for: user_profile upsert (no INSERT policy by design), webhook-driven subscription updates, waitlist inserts
- Never disable RLS

**Non-blocking follow-up (W2+)**: waitlist.ab_variant could be NOT NULL DEFAULT 'C'.

Related: [[polar_payment_architecture]]
