# Cohort Documentation Index

> **원칙:** `README.md`(레포 루트) = **현재 `main` 아키텍처 한눈에**.  
> 면접 Q&A·심층 해설·운영 저널 = 이 디렉터리. **버전 디렉터리 우선 → Git 브랜치는 그에 맞춤.**

---

## 버전별 아키텍처 (SoT)

| 디렉터리 | Git 브랜치 | 상태 | 설명 |
|----------|------------|------|------|
| [`versions/v1-main/`](versions/v1-main/ARCHITECTURE.md) | `main` | **운영 중** | V1 PWA monolith — cohort.co.kr |
| [`versions/v2-engineering/`](versions/v2-engineering/ARCHITECTURE.md) | `version/v2-engineering` *(생성 예정)* | **목표 설계** | TDD/DDD, CI, Docker, BrokerPort, IPS |
| [`versions/v3-learning-cycle/`](versions/v3-learning-cycle/VISION.md) | `version/v3-learning` *(미래)* | **비전** | 퀴즈 게이트, 분기 복기, 백테스트 |

브랜치 명명 규칙: [`engineering/branch-versioning.md`](engineering/branch-versioning.md)

---

## 엔지니어링 방법론

| 문서 | 내용 |
|------|------|
| [`engineering/agent-harness.md`](engineering/agent-harness.md) | 서브에이전트·브랜치·PR·머지 (integration tax 대응) |
| [`engineering/tdd-ddd-playbook.md`](engineering/tdd-ddd-playbook.md) | v2부터 실운용할 TDD + DDD 경계 |
| [`engineering/docker-local.md`](engineering/docker-local.md) | 로컬 Docker / 향후 monorepo 레이아웃 |
| [`engineering/dependency-upgrades.md`](engineering/dependency-upgrades.md) | Stack versions, removed deps, deferred bumps |
| [`engineering/observability.md`](engineering/observability.md) | PostHog · Sentry · Prometheus/Grafana — 무엇을 볼 것인가 |
| [`engineering/phase-0-closeout.md`](engineering/phase-0-closeout.md) | **v2 시작 전** pending inventory + exit criteria |
| [`engineering/founder-interview-log.md`](engineering/founder-interview-log.md) | CEO decisions (Q1–Q4 closed 2026-06-12) |

---

## 작업 저널 (시계열 학습)

| 기간 / 버전 | 파일 |
|-------------|------|
| 2026-06 V1 ship | [`journal/2026-06-v1-ship/JOURNAL.md`](journal/2026-06-v1-ship/JOURNAL.md) |

새 작업 주기 시작 시: `journal/YYYY-MM-<slug>/JOURNAL.md` 복사해서 사용.  
템플릿: [`journal/TEMPLATE.md`](journal/TEMPLATE.md)

---

## 심층 / 면접 / 레거시 (README에 넣지 않음)

| 문서 | 용도 |
|------|------|
| [`architecture-system-design.md`](architecture-system-design.md) | 시스템 해설 + CTO/실무 Q&A 15+ |
| [`handoff-20260611/`](handoff-20260611/) | 2026-06 핸드오프 스냅샷 (로드맵, 에이전트 큐) |
| [`pipa-compliance.md`](pipa-compliance.md) | PIPA 체크리스트 |
| [`mascot-persona-guide.md`](mascot-persona-guide.md) | Aurora/Vesper 카피 |

---

## 빠른 링크

- 라이브: https://www.cohort.co.kr/
- 4단 로드맵 L1–L4: [`handoff-20260611/portfolio-tool-roadmap.md`](handoff-20260611/portfolio-tool-roadmap.md)
- Docker 로컬: `docker compose up` → [`engineering/docker-local.md`](engineering/docker-local.md)
