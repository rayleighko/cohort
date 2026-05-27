-- =============================================================================
-- Cohort 0012 — aurora_narration_log anon SELECT + table separation contract
-- (W5 Wed, 2026-05-27, D25 archive fallback).
--
-- AuroraNarrationCard first-paints with the most recent morning_brief from
-- aurora_narration_log (vault 61 v2 D25, CEO confirm 2026-05-27 ACCEPT). The
-- helper runs server-side with the service-role client, but the anon SELECT
-- policy is added so the contract is explicit and matches the future-proof
-- separation note recorded in vault 14 §14.5.
--
-- PIPA-safe: this table is Tier 0 PUBLIC-only. No user_id column, no
-- user-specific narration. Sprint 1+ profile-aware Aurora chat (vault 51 §3)
-- MUST use a separate table or user_id-scoped RLS — see table COMMENT below.
--
-- Idempotent: re-running is safe.
-- =============================================================================

COMMENT ON TABLE public.aurora_narration_log IS
  'Tier 0 anonymous public narration log. PIPA-safe — no user identifier '
  'stored. composite_snapshot contains aggregate ECOS/FRED macro data only. '
  'DO NOT add user_id column or user-specific narration to this table. '
  'Sprint 1+ profile-aware Aurora chat MUST use a separate table with '
  'user_id-scoped RLS. Anon SELECT policy is permanent (D25 archive '
  'fallback contract, CEO confirm 2026-05-27).';

DROP POLICY IF EXISTS "aurora_narration_log_anon_select"
  ON public.aurora_narration_log;
CREATE POLICY "aurora_narration_log_anon_select"
  ON public.aurora_narration_log
  FOR SELECT
  TO anon, authenticated
  USING (true);
