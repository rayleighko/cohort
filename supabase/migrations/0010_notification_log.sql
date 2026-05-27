-- Migration: 0010_notification_log
-- W4 Thu notification_log — audit + retry tracking
-- Refs: vault 62 §2 Q3 (4-category routing), vault 56 D9 (2-track delivery)
-- Idempotent by CREATE TABLE/INDEX IF NOT EXISTS and DROP POLICY IF EXISTS.

CREATE TABLE IF NOT EXISTS public.notification_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel             TEXT        NOT NULL CHECK (channel IN ('web_push', 'kakao_alimtalk')),
  category            TEXT        NOT NULL CHECK (category IN ('trigger_alert', 'morning_brief', 'plan_reference', 'behavioral_guard')),
  voice               TEXT        NOT NULL CHECK (voice IN ('aurora', 'vesper')),
  body                TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id TEXT,
  error_message       TEXT,
  retry_count         INTEGER     NOT NULL DEFAULT 0,
  trigger_id          UUID        REFERENCES public.shape_c_triggers(id) ON DELETE SET NULL,
  behavioral_event_id UUID        REFERENCES public.behavioral_event(id) ON DELETE SET NULL,
  payload_jsonb       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_created
  ON public.notification_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_retry_sweep
  ON public.notification_log (status, created_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_notification_log_trigger
  ON public.notification_log (trigger_id)
  WHERE trigger_id IS NOT NULL;

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select" ON public.notification_log;
CREATE POLICY "owner_select" ON public.notification_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_insert" ON public.notification_log;
CREATE POLICY "service_role_insert" ON public.notification_log
  FOR INSERT TO service_role
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "service_role_update" ON public.notification_log;
CREATE POLICY "service_role_update" ON public.notification_log
  FOR UPDATE TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);
