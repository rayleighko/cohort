# Cursor 핸드오프 — cohort 작업 인계 (2026-06-11, Cowork 세션으로부터)

너는 cohort 레포에서 Ray(고명진, ~6년차 SWE, 글로벌/딥테크 이직 준비 중)와 함께 작업하는 엔지니어링 파트너다. 이 문서는 직전 Cowork(Claude) 세션의 검증된 결과물 인계서다. 이 디렉터리의 문서 4개가 SoT이니 작업 전 반드시 읽어라:

- `cohort-ideation-2026-06.md` — 전체 방향: 레포 실측, 비전("투자 규율 코치", 역게임화), 규제 가드레일, Phase 0–4 로드맵, 비용, BM, AI-Native 루프
- `cohort-profile-engine-design.md` — 투자 성향 진단(ProfileEngine) 설계 v0.1 + Ray 확정 결정사항(§7) + 남은 작업(§10)
- `gl-rts-13-korean.md` — GL-RTS 13문항 번안 완료본(원문 verbatim·채점 키·문항별 주석·출처). 채점 구현의 SoT. **Q12 채점은 a=1,b=2,c=3 — 시중 핸드아웃의 "D=4"는 오타임이 검증됨**
- `cohort-ai-setup-audit.md` — .claude/.cursor/CLAUDE.md 진단 + 개선 실행 순서

## 절대 원칙 (위반 금지)

1. **정직성**: 검증 불가한 수치·안 한 일 생성 금지. 추측은 추측이라고 말하고, 코드/문서를 직접 읽어 검증한 후 행동(레포 메모리의 stale-assumption-verify-gate 패턴 준수).
2. **핵심 로직은 Ray가 직접 타이핑**: 채점 엔진(scoreGlRts/classifyBit), 인증·권한, 주문 멱등성, 브로커 추상화는 설계·옵션·트레이드오프 제시와 테스트 설계까지만 돕고, 구현 타이핑은 Ray가 한다. 보일러플레이트(UI 스텝퍼, zod 스키마, 마이그레이션 골격, CI yaml)는 네가 만들어도 된다.
3. **Option B (무추천 원칙)**: 추천/권장/비중 X%/매수·매도 지시 카피 절대 금지 — 자본시장법 투자자문업 경계. 추천의 주어는 항상 "사용자 본인의 원칙(IPS)".
4. **커밋 규율**: `.cursor/rules/main.mdc`와 CLAUDE.md의 Sub-agent Workflow Discipline 준수 — 한 sub-task = 한 commit, 스코프 내 파일만 stage, `npx tsc --noEmit` 통과 후 커밋, Conventional Commits, `--no-verify` 절대 금지, push는 batch 끝에서만 `git push origin main`, force 계열 전부 금지.
5. **기존 4유형 네이밍 확정**: 등대(Preserver) / 물결(Follower) / 나침반(Individualist) / **불꽃**(Accumulator). 코치 톤: 등대·물결=Aurora 🕊, 나침반·불꽃=Vesper 🦅.

## 이미 끝난 것 (재작업 금지)

- `sbp_` Supabase 계정 토큰 **revoke 완료** (Ray가 직접 수행). 단 `.cursor/mcp.json` 파일 내 문자열 제거와 히스토리 purge는 미수행 → Task 0.
- GL-RTS 13문항 번안 + 채점 키 + 주석 (gl-rts-13-korean.md)
- 마이그레이션 13개 전수 검증: 빈 Supabase 프로젝트에 0001→0013 순서로 무수정 적용 가능. 유일 확장 uuid-ossp, 하드코딩 값 없음, seed.sql 빈 파일. 0001·0007은 재실행 시 정책 중복 에러(1회 실행 엄수).
- 결정 확정: onboarding Q1–Q15와 GL-RTS **통합**(병행 아님) / 라이트 2문항 진단을 비로그인 랜딩 노출(익명 결과는 DB 미저장, 서명 토큰으로 가입 시 클레임) / profile_snapshot 타임라인이 장기 코어(성향 변화→당시 원칙→백테스트/실성과 연대기).

## 작업 큐 (우선순위순 — Task 0부터 바로 시작)

**Task 0 — 보안 마무리** `chore(security)`
1. `.cursor/mcp.json`에서 SUPABASE_ACCESS_TOKEN 값 제거(환경변수 참조로 대체하거나 키 삭제)
2. `lawyer-attachments-html/` 디렉터리 제거 (내부 사업 정보 노출 — 내용은 로컬 백업 후)
3. gitleaks 전체 히스토리 스캔 → 발견 항목 보고
4. `git filter-repo`로 위 두 항목 히스토리 purge (⚠️ 원격 force-push가 필요한 유일한 예외 작업 — **실행 전 Ray에게 계획 보고하고 명시 승인 받을 것.** 협업자 없는 개인 레포라 안전하지만 규율상 승인 필수)
5. CLAUDE.md의 "Repo: plancy-dev/cohort (private)" → 실제(rayleighko/cohort, public)로 수정

**Task 1 — 새 Supabase 프로젝트 마이그레이션** `chore(db)`
```bash
supabase login && supabase link --project-ref <Ray에게 요청>
supabase db push --dry-run   # 0001~0013 순서 확인 후
supabase db push
supabase gen types typescript --linked > src/types/database.ts  # diff 확인
```
대시보드 수동: Auth URL Configuration(site_url=프로덕션 도메인), 이메일 confirm OFF(0013이 confirm 없는 로그인 전제). env 3종 교체(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY). 기존 프로젝트의 운영 데이터(waitlist, auth.users)는 스키마와 별개 — 이관 필요 여부 Ray에게 확인.

**Task 2 — GitHub Actions CI + branch protection** `ci`
`.claude/hooks/pre-push.sh`의 5단계(레거시 준/Joon grep, Option B 금지어 grep, typecheck, lint, safety-filter 테스트)를 `.github/workflows/ci.yml`로 승격. pnpm 캐시 포함. 이후 Ray가 대시보드에서 branch protection 설정. 이게 생겨야 에이전트 루프의 머신 게이트가 생긴다(audit 문서 §P2).

**Task 3 — 메모리/문서 위생 1회 정리** `docs(memory)`
- MEMORY.md 깨진 링크 5건(cohort_concept_pacemaker 등 — 로컬에 있으면 커밋, 없으면 인덱스에서 제거)
- `postgres_migration_history.md` 0004–0013 백필
- CLAUDE.md drift 수정: Toss Payments→Polar 현행화
- `.cursor/MEMORIES.md`(0바이트) 삭제, 위키링크 표기를 실제 파일명(snake_case)과 통일

**Task 4 — onboarding Q1–Q15 ↔ GL-RTS 통합 매핑 표** `docs(profile)`
`src/`에서 기존 설문 문항 원문을 직접 읽고(컴포넌트 SurveyModal·`/api/survey`·onboarding_response 스키마), 문항별로 [GL-RTS로 대체 / 사실정보로 유지 / 삭제] 매핑 표를 `docs/handoff-20260611/survey-merge-map.md`로 작성 → Ray 승인 후 구현.

**Task 5 — 채점 엔진 TDD (Ray 페어 세션)**
`scoreGlRts` / `classifyBit` / `toKofiaBand` 순수 함수 3개. 네 역할: Red 테스트 케이스 설계(채점 키는 gl-rts-13-korean.md가 SoT, Q9/10 평균 규칙·Q12 3지선다·경계값·불완전 응답 거부 포함), Ray가 Green 구현 타이핑, 네가 리뷰. `profile_version = 'glrts-ko-v0.1'`.

**Task 6+** (Ray와 협의 후): profile_snapshot 마이그레이션 초안 → 라이트 2문항 랜딩+서명 토큰 → 유형 카드 OG 이미지 → 편향 8문항(후순위 확정).

## 작업 방식

- 각 Task 시작 전 관련 파일을 실제로 읽고 현황을 1문단으로 보고 → 진행. 끝나면 commit hash + `git status --short` 보고.
- 모호하면 추측하지 말고 Ray에게 물어라. 특히: filter-repo 실행, Supabase project-ref, 기존 데이터 이관 여부, Task 4 매핑 표 승인.
- "이건 ADR감인가?"를 결정마다 물어라. 후보: CI 도입, 성향 진단 체계 선정(초안이 design 문서 §6에 있음), 익명 결과 서명 토큰 패턴.
