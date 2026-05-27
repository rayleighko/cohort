-- Hotfix #7: user_profile INSERT RLS policy + UPDATE WITH CHECK 강화.
--
-- Root cause (W5 Wed 2026-05-27 dogfood): /onboarding 동의 저장이 403으로
-- 실패. 0001_initial_schema에서 user_profile은 SELECT + UPDATE policy만
-- 정의되어 있어 INSERT가 RLS deny된다. 원래 /api/auth/callback이
-- service-role로 row를 seed하는 설계였지만, 사용자가 이메일 verify를
-- 거치지 않고 비밀번호 로그인으로 바로 진입하면 user_profile row가 없는
-- 상태로 /onboarding에 도달한다. Hotfix #6에서 update → upsert로 바꾼
-- 이후에도 INSERT path에서 동일하게 거부됨.
--
-- 추가로 UPDATE policy에 WITH CHECK이 없으면 row의 id 컬럼을 다른 uid로
-- 바꾸는 privilege escalation이 이론상 통과될 수 있어 같이 막는다.
--
-- DROP POLICY IF EXISTS 패턴: 0001이 이미 production에 apply 되어 있는
-- 환경에서도 이 migration이 재실행 가능하도록 idempotent.

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profile;
CREATE POLICY "Users can insert own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
CREATE POLICY "Users can update own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
