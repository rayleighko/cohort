-- =============================================================================
-- Cohort — initial schema (8 tables, RLS on every user-data table).
-- Per 25-sprint-0-w1-implementation-spec §4, with brand mapping applied:
--   joon_chat               -> mascot_chat (+ `character` column: aurora|vesper)
--   user_profile.joon_*     -> user_profile.mascot_*
-- TODO(Day 2): apply via `supabase db push` once the production project is linked.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- User profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Anonymous segment profile (sophistication tier reveal)
    experience_years_range TEXT,            -- '1-2' / '3-5' / '6-10' / '10+'
    sub_cluster TEXT,                       -- 'B.1.a' / 'B.1.b' / 'B.1.c' / 'mixed'

    -- Tier subscription
    current_tier TEXT DEFAULT 'free',       -- 'free' / 'trial' / 'pro' / 'premium'
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    subscription_active BOOLEAN DEFAULT FALSE,
    subscription_renewal_at TIMESTAMPTZ,

    -- PIPA consent
    consent_analytics BOOLEAN DEFAULT FALSE,
    consent_interview BOOLEAN DEFAULT FALSE,
    consent_kakao_notification BOOLEAN DEFAULT FALSE,

    -- Landing version + acquisition
    landing_page_version TEXT,              -- 'A' / 'B' / 'C'
    acquisition_channel TEXT,

    -- Mascot interaction (Cohort dual mascot: Aurora + Vesper)
    mascot_streak_days INTEGER DEFAULT 0,
    mascot_last_interaction_at TIMESTAMPTZ
);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON user_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profile FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- Onboarding survey responses (Q1-Q15 per 20-sim-real-verification §11.1)
-- =============================================================================
CREATE TABLE IF NOT EXISTS onboarding_response (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Section A
    experience_years TEXT,
    allocation_kr INTEGER,
    allocation_us INTEGER,
    allocation_bond INTEGER,
    allocation_cash INTEGER,
    allocation_macro INTEGER,
    allocation_crypto INTEGER,
    allocation_other INTEGER,
    account_isa BOOLEAN DEFAULT FALSE,
    account_pension BOOLEAN DEFAULT FALSE,
    account_irp BOOLEAN DEFAULT FALSE,
    account_youth BOOLEAN DEFAULT FALSE,
    sources TEXT[],

    -- Section B
    plan_intuition_score INTEGER,
    macro_frequency TEXT,
    weekly_trades TEXT,

    -- Section C
    past_paid_services TEXT[],
    monthly_budget TEXT,
    trial_duration_preferred TEXT,

    -- Section D
    leading_room_experience TEXT,
    impersonation_received TEXT,

    -- Section E
    profession TEXT,
    acquisition_channel TEXT,
    landing_page_version TEXT
);

ALTER TABLE onboarding_response ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own onboarding" ON onboarding_response FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON onboarding_response FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Recurring micro-survey responses
-- =============================================================================
CREATE TABLE IF NOT EXISTS micro_survey_response (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_number INTEGER,
    trigger_type TEXT,
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE micro_survey_response ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own micro survey" ON micro_survey_response FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own micro survey" ON micro_survey_response FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- LOI conversion tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS loi_conversion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    conversion_decision TEXT,
    churn_reason TEXT[],
    payment_started_at TIMESTAMPTZ,
    retention_30d BOOLEAN,
    retention_90d BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loi_conversion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own LOI" ON loi_conversion FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- Shape C nudge engagement log
-- =============================================================================
CREATE TABLE IF NOT EXISTS shape_c_nudge_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nudge_type TEXT,
    nudge_ux_variant TEXT,
    fired_at TIMESTAMPTZ DEFAULT NOW(),
    user_feedback TEXT,
    user_action_after TEXT,
    user_context JSONB
);

ALTER TABLE shape_c_nudge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own nudge log" ON shape_c_nudge_log FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- User watchlist
-- =============================================================================
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    market TEXT NOT NULL,                   -- 'KR' / 'US' / 'ETF' etc.
    added_at TIMESTAMPTZ DEFAULT NOW(),
    plan JSONB,                             -- 분할매수 plan + trigger references
    UNIQUE(user_id, ticker)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist" ON watchlist FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Custom triggers (Shape C)
-- =============================================================================
CREATE TABLE IF NOT EXISTS trigger_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    type TEXT,                              -- 'price' / 'macro' / 'composite' / 'disclosure'
    condition JSONB,                        -- e.g. {"ticker":"005930","operator":"<=","value":70000}
    cooldown_hours INTEGER DEFAULT 24,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_fired_at TIMESTAMPTZ
);

ALTER TABLE trigger_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own triggers" ON trigger_config FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Mascot chat history (Aurora + Vesper) — brand mapping: joon_chat -> mascot_chat
-- =============================================================================
CREATE TABLE IF NOT EXISTS mascot_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    character TEXT NOT NULL CHECK (character IN ('aurora', 'vesper')),
    role TEXT NOT NULL,                     -- 'user' / 'mascot'
    content TEXT NOT NULL,
    safety_filter_triggered BOOLEAN DEFAULT FALSE,
    safety_filter_category TEXT,            -- 'ADVISORY_REQUEST' / 'EDUCATION' / 'PLAN_REFERENCE' / 'MENTAL_SUPPORT' / 'OTHER'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mascot_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own chat" ON mascot_chat FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat" ON mascot_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Push notification subscriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS push_subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscription ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own push subscription" ON push_subscription FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_trigger_user_active ON trigger_config(user_id, active);
CREATE INDEX IF NOT EXISTS idx_mascot_chat_user_created ON mascot_chat(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shape_c_user_fired ON shape_c_nudge_log(user_id, fired_at DESC);
