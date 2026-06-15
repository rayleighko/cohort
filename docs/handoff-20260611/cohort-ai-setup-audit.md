# cohort AI-Native 셋업 진단 (.claude/.cursor/CLAUDE.md) — 2026-06-11

> 전수 조사 기반: agents 3, commands 6, skills 4, hooks 1, memory 24(11개 전문 열람), CLAUDE.md 전문, .cursor 구성.

## 0. 🚨 보안 (최우선)

- **`.cursor/mcp.json`에 `SUPABASE_ACCESS_TOKEN: sbp_8d5d...b6d7` 평문 커밋 — 공개 레포.** `sbp_` 토큰은 계정 전체 Management API 권한. → 즉시 revoke(supabase.com/dashboard/account/tokens) → 파일 수정 → 추후 `git filter-repo`로 히스토리 purge + gitleaks 전체 스캔.
- CLAUDE.md "Repo: plancy-dev/cohort (private)" ↔ 실제 rayleighko/cohort **public**. 공개가 의도라면 CLAUDE.md 수정 + `lawyer-attachments-html/` 제거가 선행돼야 함.

## 1. 잘 만들어진 것 (유지)

- **드물게 성숙한 셋업**: 읽기 전용 리뷰어 에이전트 3종(product/design-system/a11y)의 역할 분담 명시, 게이트형 워크플로(`/context`→`/goal`→작업→`/review`→`/retro`), 메모리의 ADR성 기록(커밋 해시·코드 포함), drift를 *카탈로그로 관리한다는 발상* 자체(vault_sot_priority.md #1–#16).
- `prompt_stale_assumption_verify_gate`(낡은 가정을 작업 1단계에서 실증 검증) — 할루시네이션 방지 패턴으로 우수, 계속 쓸 것.
- 안전필터/Option B 규칙이 에이전트·스킬·훅·메모리에 일관 반영 — 규제 가드레일이 개발 루프에 내장돼 있음.

## 2. 구조적 문제 진단

### P1. SoT가 4중 미러 + 자기모순
같은 규칙이 ① 로컬 vault(레포 밖 `~/Documents/elevate-portfolio/`) ② CLAUDE.md ③ `.claude/agents|skills` ④ `.cursor/rules/*.mdc`(원본의 1–2.7KB 축약판)에 반복. CLAUDE.md는 "vault가 SoT"(AO-5)라면서 다른 섹션에선 ".cursor/rules/main.mdc가 SoT"라고 선언. **레포만 클론한 에이전트(CI·Cowork·협업자)는 vault를 읽을 수 없어 SoT 접근 불가** — "팀처럼 일한 흔적"이라는 갭 A 목표와 정면 충돌.

**개선**: SoT를 레포 안으로. vault의 제품·설계 핵심을 `docs/`로 승격(민감 정보 제외), CLAUDE.md는 `docs/` 포인터 + 불변 제약만 유지. `.cursor/rules`는 손으로 쓰지 말고 CLAUDE.md에서 스크립트 생성(또는 Cursor 안 쓰면 삭제). 우선순위 선언은 한 줄로: "충돌 시 docs/ > CLAUDE.md > memory".

### P2. 강제 장치가 전부 '수동 설치' 의존
pre-push.sh는 수동 심링크 필요, pre-commit도 `pre-commit install` 필요, `.claude/settings.json` 부재(네이티브 훅 0), **CI 부재**. 즉 게이트가 전부 "Ray의 로컬 머신 + Ray의 기억"에 있음. `--no-verify` 금지를 문서 3곳에 쓰는 건 강제가 아니라 부탁.

**개선(루프 엔지니어링의 핵심)**:
1. **GitHub Actions가 진짜 게이트** — pre-push.sh의 5단계(레거시 grep, Option B grep, typecheck, lint, safety-filter 테스트)를 워크플로로 승격 + branch protection. 로컬 훅은 빠른 피드백용으로 유지.
2. `.claude/settings.json` 추가 — 최소: PreToolUse로 `.env*`/시크릿 파일 Read·Write 차단, PostToolUse(Edit)에 typecheck 같은 경량 검사 또는 Stop 훅에서 `pnpm lint` 요약. (훅 전략 자체가 ADR감)
3. 이러면 "토큰 예산 내 에이전트 자율 루프"가 안전해짐: 이슈(수직 슬라이스 스코프) → 에이전트 작업 → CI 그린 = 성공 판정 → PR → 사람 머지. 판정이 머신에 있어야 루프가 돈다.

### P3. 메모리 위생 — 신뢰도가 새고 있음
- MEMORY.md 인덱스의 **깨진 링크 5건**(레포에 없는 파일 참조 — 로컬 미커밋 추정)
- `postgres_migration_history.md`가 0003에서 정지(실제 13개) — *메모리를 믿으면 틀리는* 상태
- vault_sot_priority.md 자체 메타데이터 거짓("~15 files, 333 LOC" ↔ 실제 24파일/~100KB), Drift #10 결번
- 위키링크 kebab-case ↔ 파일명 snake_case 불일치, CLAUDE.md·memory 간 중복 사본 4건+, 모든 메모리가 5/21–5/24에 정지(2.5주 무갱신)

**개선**: ① 1회성 정리 커밋(깨진 링크 해소: 로컬 파일 커밋 or 인덱스에서 제거, 마이그레이션 이력 0004–0013 백필, 중복 4건은 CLAUDE.md 포인터로 대체, 링크 규칙 통일) ② `/retro`에 "인덱스 무결성 검증(파일 존재 grep)" 단계 추가 ③ 메모리 frontmatter에 `verified_at` 추가하고 N주 초과 시 stale 표시 — `prompt_stale_assumption_verify_gate`를 메모리 자신에게 적용하는 것.

### P4. 참조되지만 존재하지 않는 것들
- `safety-filter-tester` 에이전트: CLAUDE.md·/review가 디스패치 대상으로 명시하나 파일 없음 → 작성하거나 참조 제거 (안전필터는 코어이므로 작성 권장: 6패턴 false-negative gap이 메모리에 이미 W4 closure로 적혀 있음 — 그 테스트를 이 에이전트로)
- `engineering:*` 스킬(plan-eng-review·review가 참조): 외부 플러그인 의존 — README나 CONTRIBUTING에 설치 전제 명시 필요
- `.cursor/MEMORIES.md` 0바이트 — 삭제

### P5. 스킬 내 상태 스냅샷 하드코딩
token-keeper가 "W1 시점 정의된 토큰 목록"을 본문에 하드코딩 — 이미 drift 가능성. **개선**: 스킬은 "tailwind.config.ts를 읽고 검증하라"는 절차만 갖고, 목록은 항상 실파일에서 읽게. (일반 원칙: 스킬/에이전트에는 *절차*를, *상태*는 코드·docs에)

## 3. 실행 순서 제안

| 순서 | 작업 | 비용 |
|---|---|---|
| 0 | sbp_ 토큰 revoke (즉시) | 5분 |
| 1 | lawyer-attachments 제거 + 히스토리 purge + gitleaks | 1h |
| 2 | GitHub Actions CI(pre-push.sh 승격) + branch protection | 1–2h |
| 3 | 메모리 1회 정리 커밋 + /retro에 무결성 단계 | 1h |
| 4 | SoT 단일화(vault 핵심→docs/ 승격, CLAUDE.md 슬림화, .cursor 정리) | 2–4h |
| 5 | settings.json 훅 + safety-filter-tester 작성 | 2h |

2번까지만 해도 "에이전트 루프의 머신 게이트"가 생기고, 4번까지 하면 *레포가 곧 SoT*가 되어 어떤 에이전트(CI/Cowork/신규 세션)든 같은 맥락에서 작동한다 — AI 최적화의 본질은 프롬프트가 아니라 **에이전트가 읽을 수 있는 곳에 진실을 두는 것**.

> 직접 수정 작업은 로컬 cohort 폴더를 이 세션에 연결해주면 내가 PR 단위로 진행 가능 (git clone은 샌드박스에서 차단됨).
