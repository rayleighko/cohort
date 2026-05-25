-- =============================================================================
-- Cohort 0006 — chat_quota_usage (W3 Thu / Day 13).
--
-- Per-tier daily message quota tracking for Aurora chat. Wired by
-- /api/aurora/chat to enforce quota BEFORE Claude call (cost + abuse cap).
--
-- Quota grid (vault 56 D6 + prompt §4 W3 Thu, supersedes vault 51 §4.2 draft):
--   tier_0 anonymous   →  10 msg / day / session
--   tier_1 free        →  50 msg / day / user
--   tier_2_pro         → 500 msg / day / user
--   tier_3_premium     → unlimited (no row-level cap, fair-use audit only)
--
-- Tier 0 anonymous (Day 13 ship): session_id populated, user_id NULL.
-- Tier 1+ (W4+ auth wiring): user_id populated. session_id MAY also be
-- populated for client-correlation, but quota lookup primary key is user_id.
--
-- Row model: ONE row per (subject, date) — the subject is either user_id
-- (Tier 1+) or session_id (Tier 0). Increments via UPSERT in the route
-- handler. message_count + per-model counters incremented atomically.
--
-- Idempotent: re-running is safe (IF NOT EXISTS / IF NOT EXISTS / IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS chat_quota_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tier 1+ authenticated subject (W4+ auth wiring). NULL for Tier 0.
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Tier 0 anonymous subject (client-generated UUID, sessionStorage).
    -- NULL once Tier 1+ auth wiring lands AND the session is auth-linked.
    session_id TEXT,

    -- Tier label — drives quota threshold lookup at route handler.
    -- Stored verbatim so historical rows preserve the tier at usage time
    -- (user's current tier may differ from past usage tier after upgrade).
    tier TEXT NOT NULL CHECK (
        tier IN ('tier_0', 'tier_1', 'tier_2_pro', 'tier_3_premium')
    ),

    -- Calendar date (KST may differ; SQL DATE is local to the server timezone
    -- which is UTC on Supabase). Route handler computes 'today' in UTC. This
    -- is acceptable because quota is a soft cap, not a billing primitive.
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Quota counter (total messages — used by route handler quota check).
    message_count INTEGER NOT NULL DEFAULT 0
        CHECK (message_count >= 0),

    -- Per-model breakdown — analytics + cost attribution. Sum of
    -- (haiku_count + sonnet_count) should equal message_count modulo
    -- in-flight race conditions during concurrent UPSERTs.
    haiku_count INTEGER NOT NULL DEFAULT 0
        CHECK (haiku_count >= 0),
    sonnet_count INTEGER NOT NULL DEFAULT 0
        CHECK (sonnet_count >= 0),

    -- Reserved for W4+ token-level cost tracking (Anthropic Message.usage).
    -- Default 0 so app-side INSERT/UPDATE statements can omit safely until
    -- token tracking ships.
    token_input_total INTEGER NOT NULL DEFAULT 0
        CHECK (token_input_total >= 0),
    token_output_total INTEGER NOT NULL DEFAULT 0
        CHECK (token_output_total >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- XOR guard: every row must have exactly one of user_id / session_id.
    -- Without this, app bugs could create orphan rows that no quota lookup
    -- can match, silently letting the user past the cap.
    CONSTRAINT chat_quota_subject_xor CHECK (
        (user_id IS NOT NULL AND session_id IS NULL)
        OR (user_id IS NULL AND session_id IS NOT NULL)
    )
);

-- One row per user per UTC date.
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_quota_per_user_per_day
    ON chat_quota_usage(user_id, date)
    WHERE user_id IS NOT NULL;

-- One row per anonymous session per UTC date.
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_quota_per_session_per_day
    ON chat_quota_usage(session_id, date)
    WHERE session_id IS NOT NULL;

-- Analytics path: created_at-bucketed engagement queries.
CREATE INDEX IF NOT EXISTS idx_chat_quota_created_at
    ON chat_quota_usage(created_at DESC);

ALTER TABLE chat_quota_usage ENABLE ROW LEVEL SECURITY;

-- Tier 1+ users may read their own quota usage for the UpgradeNudge UI.
-- Tier 0 anonymous rows have user_id IS NULL → this policy doesn't match,
-- so they cannot be read by anon clients (correct — anon should only see
-- their own quota via the API, never via Supabase direct query).
CREATE POLICY chat_quota_owner_read ON chat_quota_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Writes are exclusively server-side via service-role client (admin) — no
-- INSERT/UPDATE policy by design. Matches 0005 aurora_chat default-deny
-- + service-role-only write pattern.
