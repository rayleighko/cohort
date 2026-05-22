-- =============================================================================
-- Cohort 0003 — waitlist (pre-launch lead capture).
-- Idempotent: re-running is safe.
-- RLS enabled with NO policies → default-deny; only the service-role client
-- (createAdminClient, used by /api/waitlist) can read/write.
-- =============================================================================

CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    consent_pipa BOOLEAN NOT NULL,
    consent_marketing BOOLEAN DEFAULT FALSE,
    ab_variant TEXT CHECK (ab_variant IN ('A', 'B', 'C')),
    referral_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
-- No policies by design — anon/authenticated clients are denied; the waitlist
-- is written only server-side via the service-role key.
