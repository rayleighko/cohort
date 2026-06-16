# Agent Queue — 순차 작업·서브에이전트·루프 엔지니어링

> **아침 진행률 질문:** `AGENT-RUN-STATUS.md` 먼저 읽기 → 또는 채팅에  
> **「@docs/handoff-20260611/AGENT-RUN-STATUS.md 진행 보고해줘」**

**규칙:** 한 task = 한 logical commit · 스코프 파일만 stage · `npx tsc --noEmit` · `--no-verify` 금지 ·  
**Ray 승인 필수:** filter-repo, force push, `scoreGlRts` Green 타이핑, 프로덕션 env·배포.

**상태:** `⬜ pending` · `🔄 in_progress` · `✅ done` · `🚫 blocked` · `⏭ skipped`

---

## Batch A — 배포 가능 상태 (Ray 테스트 전)

| ID | Task | Sub-agent | Gate | Status | Depends |
|----|------|-----------|------|--------|---------|
| A1 | 로컬 diff 정리: macro/Aurora freshness + support UI + terms/privacy KO | parent agent | tsc + vitest macro/aurora | ⬜ | — |
| A2 | `docs/handoff` 동기화 (HANDOFF + RUN-STATUS) | parent | — | 🔄 | — |
| A3 | `.env.local.example`에 `TOSS_*` + `TOSS_LAB_ENABLED` | parent | — | ✅ | — |
| A4 | **Ray: commit + push** (1–3 commits, Conventional) | Ray | pre-push hook | ✅ | 8b6753d |
| A5 | Vercel redeploy + PostHog 퍼널 smoke | Ray | manual | ⬜ | Ray manual |

**A1 디스패치 (병렬 가능):**
- `cohort-design-system` + `cohort-accessibility-auditor` — SubscriptionPanel, settings (UI touch 시)
- `cohort-product` — Aurora 지원 카피 (SubscriptionPanel)

---

## Batch B — 머신 게이트 (에이전트 단독 가능)

| ID | Task | Sub-agent | Gate | Status | Depends |
|----|------|-----------|------|--------|---------|
| B1 | GitHub Actions CI (Task 2) | `shell` + parent | CI green | ✅ | push 후 verify |
| B2 | `postgres_migration_history.md` 0004–0013 백필 | parent | — | ✅ | 0014 추가 |
| B3 | CLAUDE.md Polar/Toss drift 수정 | parent | — | ✅ | main.mdc |

---

## Batch C — 제품 (순차)

| ID | Task | Sub-agent | Gate | Status | Depends |
|----|------|-----------|------|--------|---------|
| C1 | Task 5 `scoreGlRts` **Green** | **Ray 타이핑** + parent review | vitest profile | 🚫 | Ray session |
| C2 | `profile_snapshot` migration 초안 | parent | migration dry-run | ⬜ | C1 |
| C3 | IPS 위저드 spec (`docs/` + zod 스키마 골격) | `cohort-component-spec-writer` | Option B copy skill | ⬜ | C2 |
| C4 | Toss **lab** read-only: `src/lib/broker/toss-lab.ts` + `/api/lab/toss/*` | parent | `TOSS_LAB_ENABLED` + NODE_ENV | ⬜ | A3 |
| C5 | `docs/infra/toss-open-api-lab.md` (개인 IP·비프로덕션) | parent | — | ⬜ | C4 |

**C4 가드 (필수):**
```ts
// pseudo — both required
process.env.NODE_ENV === 'development' && process.env.TOSS_LAB_ENABLED === 'true'
```

---

## Batch D — 보안 (Ray 승인 후만)

| ID | Task | Status | Note |
|----|------|--------|------|
| D1 | `.cursor/mcp.json` token 제거 | ✅ | env ref only |
| D2 | `lawyer-attachments-html/` 삭제 + filter-repo | 🚫 | **Ray 명시 승인** |
| D3 | gitleaks scan | ⬜ | D2 후 |

---

## Overnight / Cloud Agent 프롬프트 (복붙용)

아래를 **Cursor Cloud Agent** 또는 **Automation (cron)** 에 넣을 때 사용.  
**주의:** uncommitted work는 Cloud가 못 볼 수 있음 → **A4 push 후** 실행 권장.

```
Repo: rayleighko/cohort
Branch: main (or agent/cursor-queue-batch-b)

Read first:
- docs/handoff-20260611/AGENT-QUEUE.md
- docs/handoff-20260611/AGENT-RUN-STATUS.md
- docs/handoff-20260611/portfolio-tool-roadmap.md

Do ONLY the next ⬜ task in Batch B or C that does NOT require Ray approval.
After each task:
1. npx tsc --noEmit
2. relevant vitest
3. single commit per task (Conventional Commits)
4. Update AGENT-RUN-STATUS.md (status table + timestamp KST)
5. Do NOT push unless AGENT-QUEUE says batch end

Stop and report blocked if: filter-repo, scoreGlRts implementation, or production secrets needed.

**Implementation quality:** All API/macro/aurora/worker PRs must satisfy [`docs/engineering/implementation-standards.md`](../engineering/implementation-standards.md) §8 checklist.
```

---

## Sub-agent 병렬 규칙 (AO-3)

| Touch surface | Parallel dispatch |
|---------------|-------------------|
| UI component + copy | `cohort-design-system` ∥ `cohort-accessibility-auditor` ∥ `cohort-product` |
| Safety filter change | + `safety-filter-tester` (W4+) |
| Broker/order code | **no parallel** — parent only, Ray review |

---

## 완료 시 RUN-STATUS 갱신 템플릿

```markdown
| ID | Done (KST) | Commit | Notes |
|----|------------|--------|-------|
| B1 | 2026-06-12 09:00 | abc1234 | ci.yml |
```
