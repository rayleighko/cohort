-- =============================================================================
-- Cohort 0002 — Polar payment provider columns on user_profile.
-- Payment provider: Polar (MoR, USD billing) — locked 2026-05-21, supersedes Toss.
-- Idempotent: re-running this migration is safe.
-- =============================================================================

-- Polar identifiers. current_tier / subscription_active / subscription_renewal_at
-- already exist (0001) and are reused provider-agnostically.
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS polar_customer_id TEXT;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profile_polar_customer
  ON user_profile(polar_customer_id);
