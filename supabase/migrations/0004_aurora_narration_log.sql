-- =============================================================================
-- Cohort 0004 — aurora_narration_log (W2 Day 4 / Day 9).
--
-- Persists Aurora narration generations across 4 categories — Day 9 prereq
-- for the W4 chat surface (history retrieval) and the W2 mini-checkpoint
-- analytics (which categories drive engagement).
--
-- Tier 0 (public surface, no auth) — no `user_id` column intentionally.
-- W4 chat surface will ADD `user_id UUID REFERENCES auth.users(id)` plus a
-- SELECT policy scoped to `auth.uid()` for personalized history.
--
-- RLS enabled with NO policies → default-deny; only the service-role
-- client (createAdminClient, used by /api/aurora/narration) can insert.
-- Mirrors the 0003 waitlist pattern.
--
-- Idempotent: re-running is safe.
-- =============================================================================

-- Use uuid_generate_v4() (uuid-ossp) to match the rest of the schema and
-- avoid pgcrypto dependency on local-dev Postgres images that don't have
-- it preinstalled. Supabase hosted has both, so prod is unaffected.
CREATE TABLE IF NOT EXISTS aurora_narration_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN (
        'morning_brief',
        'single_indicator_focus',
        'score_change',
        'weekly_summary'
    )),
    composite_snapshot JSONB NOT NULL,
    text TEXT NOT NULL,
    triggered BOOLEAN NOT NULL DEFAULT FALSE,
    safety_filter_category TEXT,
    character TEXT NOT NULL DEFAULT 'aurora' CHECK (character IN ('aurora', 'vesper')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aurora_narration_log_created_at
    ON aurora_narration_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aurora_narration_log_category
    ON aurora_narration_log(category);

ALTER TABLE aurora_narration_log ENABLE ROW LEVEL SECURITY;
-- No policies by design — anon/authenticated clients are denied; rows are
-- written only server-side via the service-role key (createAdminClient).
-- W4 chat surface will add a SELECT policy + user_id column.
