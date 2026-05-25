-- =============================================================================
-- Cohort 0007 — user_investment_profile (W3 Fri scaffold)
--
-- Investment Profile Survey 10Q + Q0 narrow filter + algorithmic output.
-- vault 61 v2 D4 + D16 + vault 53 §1.3.2 + vault 59 §3.2 + vault 57 §3 Q5 정합.
--
-- PIPA strict (.cursor/rules/strategic-constraints.mdc 정합):
--   - Q2 portfolio_composition_pct JSONB (% 비율만, 절대 금액 X)
--   - RLS user_profile_owner (auth.uid() = user_id)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_investment_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Q0 narrow filter (vault 61 D16 + vault 59 §3.2)
    user_stage TEXT CHECK (user_stage IN (
        'learning',                       -- (a) graceful exit + silent Valley referral
        'post_learning_planned',          -- (b) fit
        'active_investor_enforcement'     -- (c) fit primary
    )),
    user_stage_self_referred_valley BOOLEAN DEFAULT FALSE,

    -- Q1-Q10 (vault 53 §1.3.2)
    time_horizon TEXT,
    asset_goal_5y TEXT,
    portfolio_composition_pct JSONB,           -- % 비율만, PII 회피
    macro_watching_freq TEXT,
    info_sources TEXT[],
    split_buy_enforcement TEXT,
    plan_formalization TEXT,
    emotional_decision_count_12m TEXT,
    framework_affinity TEXT[],                 -- 7 카테고리 multi-select (vault 57 §3 Q5)
    framework_self_described TEXT,             -- Q11 open text fallback (unsure 시)
    weakness_self_assessment TEXT,             -- Q9 behavioral guard signal
    payment_willingness_ceiling_krw INTEGER,
    service_expectations TEXT[],

    -- Algorithmic output (W4 Fri populate via profile-classifier.ts)
    cluster_b_sub_classification TEXT,
    classification_confidence SMALLINT,
    framework_affinity_inferred TEXT[],
    shape_c_trigger_presets JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_investment_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profile_owner ON user_investment_profile
    FOR ALL USING (auth.uid() = user_id);
