-- Migration: 0009_behavioral_event
-- W4 Wed Shape C — behavioral_event log
-- Refs: vault 62 §2, vault 56 D9
-- Idempotent by CREATE TABLE/INDEX IF NOT EXISTS and DROP POLICY IF EXISTS.

CREATE TABLE IF NOT EXISTS public.behavioral_event (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL,
  trigger_id    UUID,
  event_type    TEXT        NOT NULL,
  severity      TEXT        NOT NULL DEFAULT 'info',
  context_jsonb JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT behavioral_event_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT behavioral_event_trigger_id_fkey
    FOREIGN KEY (trigger_id) REFERENCES public.shape_c_triggers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_behavioral_event_user_created
  ON public.behavioral_event (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavioral_event_trigger
  ON public.behavioral_event (trigger_id)
  WHERE trigger_id IS NOT NULL;

ALTER TABLE public.behavioral_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select" ON public.behavioral_event;
CREATE POLICY "owner_select" ON public.behavioral_event
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_insert" ON public.behavioral_event;
CREATE POLICY "service_role_insert" ON public.behavioral_event
  FOR INSERT TO service_role
  WITH CHECK (TRUE);
