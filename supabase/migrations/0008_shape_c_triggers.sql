-- Migration: 0008_shape_c_triggers
-- Documents the shape_c_triggers table already applied to the remote DB.
-- Re-running is idempotent via CREATE TABLE IF NOT EXISTS + CREATE POLICY IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.shape_c_triggers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type   TEXT        NOT NULL CHECK (trigger_type IN ('price_drop', 'macro_composite')),
  condition_params JSONB     NOT NULL DEFAULT '{}',
  cooldown_hours INTEGER     NOT NULL DEFAULT 24,
  last_fired_at  TIMESTAMPTZ,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  label          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shape_c_triggers_user_id_idx ON public.shape_c_triggers(user_id);
CREATE INDEX IF NOT EXISTS shape_c_triggers_active_idx  ON public.shape_c_triggers(user_id, is_active);

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shape_c_triggers_set_updated_at ON public.shape_c_triggers;
CREATE TRIGGER shape_c_triggers_set_updated_at
  BEFORE UPDATE ON public.shape_c_triggers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: owner-only access
ALTER TABLE public.shape_c_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select" ON public.shape_c_triggers;
CREATE POLICY "owner_select" ON public.shape_c_triggers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert" ON public.shape_c_triggers;
CREATE POLICY "owner_insert" ON public.shape_c_triggers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update" ON public.shape_c_triggers;
CREATE POLICY "owner_update" ON public.shape_c_triggers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete" ON public.shape_c_triggers;
CREATE POLICY "owner_delete" ON public.shape_c_triggers
  FOR DELETE USING (auth.uid() = user_id);
