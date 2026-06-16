-- =============================================================================
-- Cohort 0015 — investment_principle (V2-004 IPS persistence)
--
-- Stores user-authored IPS documents (ips-v0.1 JSONB). Option B: no AI advice.
-- PIPA: allocation weights are % only — no absolute amounts in document JSON.
--
-- Companion + Shape C read active IPS / triggers via RLS (auth.uid() = user_id).
-- Apply after review; idempotent patterns match 0008_shape_c_triggers.
--
-- Refs: docs/specs/ips-wizard.md §3, src/domains/principle/domain/ips-schema.ts
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.investment_principle (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version          INTEGER     NOT NULL DEFAULT 1 CHECK (version >= 1),
  document         JSONB       NOT NULL,
  acknowledged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT investment_principle_document_object CHECK (jsonb_typeof(document) = 'object')
);

-- One active IPS row per user (superseded rows keep history).
CREATE UNIQUE INDEX IF NOT EXISTS investment_principle_active_user_idx
  ON public.investment_principle (user_id)
  WHERE superseded_at IS NULL;

CREATE INDEX IF NOT EXISTS investment_principle_user_created_idx
  ON public.investment_principle (user_id, created_at DESC);

COMMENT ON TABLE public.investment_principle IS
  'User IPS (Investment Policy Statement) versions — ips-v0.1 document JSONB.';
COMMENT ON COLUMN public.investment_principle.document IS
  'IpsDocument (Zod ipsDocumentSchema) — validated on API before insert.';
COMMENT ON COLUMN public.investment_principle.superseded_at IS
  'NULL = active; set when user submits a newer IPS version.';

-- Optional link from investment profile survey → active IPS (nullable).
ALTER TABLE public.user_investment_profile
  ADD COLUMN IF NOT EXISTS linked_principle_id UUID
  REFERENCES public.investment_principle(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_investment_profile_linked_principle_idx
  ON public.user_investment_profile (linked_principle_id)
  WHERE linked_principle_id IS NOT NULL;

-- RLS: owner-only
ALTER TABLE public.investment_principle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investment_principle_owner_select" ON public.investment_principle;
CREATE POLICY "investment_principle_owner_select" ON public.investment_principle
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_principle_owner_insert" ON public.investment_principle;
CREATE POLICY "investment_principle_owner_insert" ON public.investment_principle
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_principle_owner_update" ON public.investment_principle;
CREATE POLICY "investment_principle_owner_update" ON public.investment_principle
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "investment_principle_owner_delete" ON public.investment_principle;
CREATE POLICY "investment_principle_owner_delete" ON public.investment_principle
  FOR DELETE USING (auth.uid() = user_id);
