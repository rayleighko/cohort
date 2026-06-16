# Founder Interview Log

> Ray decision queue — agents **must append** when spec is ambiguous.  
> **Closed decisions** are binding for v2/v3 specs.

---

## Closed decisions

### 2026-06-12 — Implementation quality bar

**Asked by:** Ray  
**Decision:** **No performance compromise on hot paths.** Prefer optimal/rational design; medium-term-necessary work (algorithms, DB-first, domain extract) gets extra effort now vs deferring hacks.

**SoT:** [`implementation-standards.md`](implementation-standards.md) + `.cursor/rules/implementation-standards.mdc`

---

### 2026-06-12 — Data platform: DB-first ingest

**Asked by:** Ray (product direction)  
**Question:** Store commercial/public API data in our DB when possible?  
**Decision:** **Yes — default DB-first** via ETL/worker; user requests read materialized tables.

**Rationale:** Cost, reuse, backtest, reproducibility, optimization.

**Gate:** Legal ToS + PIPA + Option B (facts only, no advisory ground truth).

**SoT:** [`data-platform-strategy.md`](data-platform-strategy.md)

---

### 2026-06-12 — Q5 Aurora brief + chat gate

**Question:** Brief open vs chat-only lock vs both lock?  
**Decision:** **Both locked** until quiz pass (initial + quarterly).

**Rationale (Ray):** 대화 내용 예측 불가; 목적은 투자 지식·전략 명확화 — 불편하면 퀴즈를 푸는 역게임화.

**Follow-up:** v3 `requireLearningGate()` on `/api/aurora/narration` + `/api/aurora/chat` + bubble UI.

---

### 2026-06-12 — Q1 Quiz gate hardness

**Question:** Hard vs soft vs nudge-only?  
**Decision:** **B — Soft gate** (refined)

**Rationale (Ray):** 투자에 실질 영향·전략적 불편·「보면 안 되는 지표 / 하면 안 되는 액션」은 퀴즈 미통과 시 **차단**. 매크로 등 저위험 영역은 허용.

**Feature matrix:** [`../versions/v3-learning-cycle/VISION.md`](../versions/v3-learning-cycle/VISION.md) § Soft gate surfaces

**Follow-up:** `learning_gate` middleware + `quiz_passed_at` / `quiz_expires_at` schema (v3)

---

### 2026-06-12 — Q2 Quarterly re-quiz

**Question:** 필수 vs 리마인더?  
**Decision:** **필수 (mandatory)**

**Rationale (Ray):** 페이스 메이커 = 퍼스널 트레이너. 서비스를 안 써도 되는데 **강제로 좋은 습관** — 분기마다 재검증.

**UX implication:** 분기 재퀴즈 미완 시 **Q1과 동일 soft gate** — 전략·실행 영역 잠금, 매크로·교육 읽기는 유지.

**Follow-up:** calendar trigger + email/push reminder 2 weeks before quarter end; 7-day grace then gate

---

### 2026-06-12 — Q3 Backtest data vendor

**Question:** KRX 유료 / US free / CSV only?  
**Decision:** **Tiered ingest — maximize free, store in our DB** (see backtest-data-strategy.md)

**Summary:**

| Phase | Source | Cost | Store in PG |
|-------|--------|------|-------------|
| BT-0 | User CSV upload | $0 | Yes |
| BT-1 | KR: FinanceDataReader / pykrx ETL (throttled) | $0* | Yes |
| BT-1b | US: Alpha Vantage free tier (seed symbols) | $0 | Yes |
| BT-2 | Manual Stooq bulk ZIP → one-time import | $0 manual | Yes |
| BT-3 | EODHD or AV paid when MAU/backfill justifies | ~$20–50/mo | Yes |

\* Scraping — not exchange-licensed; educational/backtest disclaimer; rate limit + cache.

**Full analysis:** [`../versions/v3-learning-cycle/backtest-data-strategy.md`](../versions/v3-learning-cycle/backtest-data-strategy.md)

**Platform principle (all domains):** [`../engineering/data-platform-strategy.md`](../engineering/data-platform-strategy.md) — DB-first when legal/technical OK.

---

### 2026-06-12 — Q4 v2 branch start (CI vs Task 5)

**Question:** `version/v2-engineering` after CI or after Task 5 Green?  
**Decision:** **Neither first — Phase 0 close-out on `main`, then CI, then v2 branch.** Task 5 is **parallel Ray track**, not a v2 branch blocker.

**Rationale (Ray):** pending/in-progress 전부 **go / defer / blocked** 로 정리하고 **멈춘 상태**에서 다음 액션.

**Orchestrator plan:** [`phase-0-closeout.md`](phase-0-closeout.md)

---

## Open questions (future)

*(none — seed queue empty; append new items below)*

---

## Format (template)

```markdown
### YYYY-MM-DD — <topic>
**Asked by:**  
**Question:**  
**Decision:**  
**Rationale:**  
**Follow-up tasks:**  
```
