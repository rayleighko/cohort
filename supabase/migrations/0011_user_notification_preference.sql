-- Migration: 0011_user_notification_preference
-- W4 Thu user_notification_preference — channel opt-in + quiet hours
-- Refs: vault 62 §2 Q3 (channel selection), vault 56 D9 (2-track), PIPA opt-in
-- Idempotent by CREATE TABLE/INDEX IF NOT EXISTS and DROP POLICY IF EXISTS.

CREATE TABLE IF NOT EXISTS public.user_notification_preference (
  user_id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  channels               TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  quiet_hours_start      TIME,
  quiet_hours_end        TIME,
  web_push_subscription  JSONB,
  kakao_user_id          TEXT,
  opt_out                BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS user_notification_preference_set_updated_at
  ON public.user_notification_preference;
CREATE TRIGGER user_notification_preference_set_updated_at
  BEFORE UPDATE ON public.user_notification_preference
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_notification_preference ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select" ON public.user_notification_preference;
CREATE POLICY "owner_select" ON public.user_notification_preference
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert" ON public.user_notification_preference;
CREATE POLICY "owner_insert" ON public.user_notification_preference
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update" ON public.user_notification_preference;
CREATE POLICY "owner_update" ON public.user_notification_preference
  FOR UPDATE USING (auth.uid() = user_id);
