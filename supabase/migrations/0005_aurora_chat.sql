-- =============================================================================
-- Cohort 0005 — aurora_chat (W3 Day 1 scaffold / Day 11).
--
-- Multi-turn Aurora chat persistence — scaffold pull-forward of W5 Day 4
-- chat full spec (26-spec line 513-524, 442-453) per operator decision Day 11.
-- Day 7-9 Aurora narration infra direct extension; scope cap = scaffold only.
--
-- Tier 0 anonymous (Day 11): session_id = client-generated UUID (sessionStorage).
-- W5 Day 4 full: user_id populated for authenticated users + RLS SELECT policy
-- added (separate migration, scoped to auth.uid() = user_id).
--
-- Drift catalog (W2-close batch trace):
--   #15 — 26-spec line 17 W1 outputs claim "joon_chat persistence" (W1 actually
--         shipped safety-filter.ts only). Migration 0005 delivers W1's deferred
--         claim under Aurora naming, 7 days late.
--   #16 — 26-spec W5 Day 4 chat full spec (line 513-524) pulled forward to
--         W3 Day 1 scaffold. W5 Day 4 retains full-rewrite scope with this
--         migration as baseline.
--
-- RLS enabled with NO policies → default-deny; only the service-role
-- client (createAdminClient, used by /api/aurora/chat) can insert.
-- Mirrors the 0003 waitlist + 0004 aurora_narration_log pattern.
--
-- Idempotent: re-running is safe.
-- =============================================================================

CREATE TABLE IF NOT EXISTS aurora_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Anonymous Tier 0 session identifier (client-generated UUID in sessionStorage).
    -- Required for last-20 context window retrieval; populated even when user_id is set.
    session_id TEXT NOT NULL,

    -- Future W5 Day 4 — authenticated user scoping. Nullable in Day 11
    -- (all rows have user_id IS NULL) per operator decision to avoid a future
    -- ALTER TABLE migration when W5 chat full ships.
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 0-indexed within a session; increments by 1 per persisted message.
    -- (session_id, turn_index DESC) is the last-20 context fetch path.
    turn_index INTEGER NOT NULL,

    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    text TEXT NOT NULL,

    -- 3-gate safety filter audit trail. user-input filter (Layer 1/2/3) sets
    -- triggered=TRUE on input-side redirect; output filter (containsForbiddenOutput
    -- or applySafetyFilter) sets triggered=TRUE on assistant-side redirect.
    safety_filter_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    safety_filter_category TEXT,

    character TEXT NOT NULL DEFAULT 'aurora' CHECK (character IN ('aurora', 'vesper')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Last-20 context fetch path: WHERE session_id = $1 ORDER BY turn_index DESC LIMIT 20.
-- UNIQUE constraint converts silent corruption (duplicate turn_index rows from
-- concurrent inserts or post-fetch-error retries) into a loud Postgres error
-- that the route handler can surface as 503 instead of returning a garbled
-- history on the next turn. Paired with the route's fetchHistory error path
-- which returns 503 rather than inserting at a guessed turn_index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_aurora_chat_session_turn
    ON aurora_chat(session_id, turn_index);

-- Analytics path: created_at-bucketed engagement queries.
CREATE INDEX IF NOT EXISTS idx_aurora_chat_created_at
    ON aurora_chat(created_at DESC);

-- W5 Day 4 auth scoping path (added now so the index exists when policy lands).
CREATE INDEX IF NOT EXISTS idx_aurora_chat_user_id
    ON aurora_chat(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE aurora_chat ENABLE ROW LEVEL SECURITY;
-- No policies by design — anon/authenticated clients are denied; rows are
-- written only server-side via the service-role key (createAdminClient).
-- W5 Day 4 chat full will add:
--   CREATE POLICY "users read own chat" ON aurora_chat FOR SELECT
--     USING (auth.uid() = user_id);
