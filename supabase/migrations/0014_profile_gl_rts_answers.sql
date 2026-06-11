-- =============================================================================
-- Cohort 0014 — GL-RTS raw answers storage (Task 4 survey integration)
-- Scoring (gl_rts_score, bit_type, kofia_band) deferred to Task 5 — Ray types scoreGlRts.
-- Refs: docs/handoff-20260611/survey-merge-map.md, cohort-profile-engine-design.md §4
-- =============================================================================

ALTER TABLE user_investment_profile
  ADD COLUMN IF NOT EXISTS gl_rts_answers JSONB,
  ADD COLUMN IF NOT EXISTS profile_version TEXT NOT NULL DEFAULT 'glrts-ko-v0.1';

COMMENT ON COLUMN user_investment_profile.gl_rts_answers IS
  'GL-RTS 13문항 응답 (q1-q13, a-d). 서버 채점 전 raw 저장. profile_version으로 재채점 추적.';

COMMENT ON COLUMN user_investment_profile.profile_version IS
  '채점 로직 버전. glrts-ko-v0.1 = Grable-Lytton 한국어 번안 v0.1 (docs/handoff-20260611/gl-rts-13-korean.md).';
