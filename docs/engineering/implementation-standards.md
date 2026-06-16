# Implementation Standards — Performance, algorithms, rational design

> **Ray bar (2026-06):** API·전역 코드는 **최적화·합리성·성능 타협 없이** 작성.  
> 중기적으로 필요한 작업이면 **공수가 더 들어도 더 좋은 방향**을 선택.  
> **Agents:** PR 전 이 문서 체크리스트 필수.

---

## 1. Quality hierarchy

```
Correctness (Option B, PIPA, RLS)
  → Reproducibility (DB-first, tests)
    → Performance (latency, cost, upstream quota)
      → Maintainability (domain boundaries, thin routes)
```

**Never trade correctness for speed.**  
**Never ship a knowingly inferior algorithm on a hot path** when the better one is bounded work (days, not weeks).

---

## 2. Hot paths (Cohort-specific)

| Path | Standard |
|------|----------|
| Dashboard macro | Read **`macro_observation`** (v2+); until then: bounded parallel upstream + shared in-memory cache — **no per-user ECOS/FRED** |
| `/api/macro/series/[code]` | Allow-list + single series fetch; v2: DB range query indexed on `(code, observation_date)` |
| Aurora narration | DB cache by `asOfDate` before Claude; **no duplicate generation** same day |
| Chat | Quota check O(1); safety short-circuit before Claude; batch DB insert |
| Shape C cron | Idempotent eval; index `trigger_config(user_id)`; **no full table scan** unbounded |
| Ingest worker | Batch upsert `ON CONFLICT`; queue in `ingest_job`; **never N sequential HTTP in one user request** |
| Drift / backtest (v2+) | Pre-indexed OHLCV; vectorized or single-pass portfolio math — document complexity |

---

## 3. API & data access rules

### Do

- **One round-trip** per logical resource where Postgres allows (join / `in()` batch).
- **`Promise.all`** for independent reads in RSC (macro + narration archive).
- **Idempotent** writes (`upsert`, unique constraints, cron safe retry).
- **Pagination / caps** on list endpoints (triggers, chat history).
- **Structured errors** + `cache-control: no-store` on stale/error (already macro pattern).
- **Rate-limit upstream** in infrastructure layer (see `ecos.ts` / `fred.ts` slot queue).

### Don’t

- Loop `await fetchUpstream(symbol)` inside a user-facing handler.
- Call Claude when DB cache hit exists.
- Load entire OHLCV history into memory for one sparkline (use last 30 rows SQL `LIMIT`).
- `SELECT *` on wide JSONB without column list.

### DB-first (mandatory direction)

See [`data-platform-strategy.md`](./data-platform-strategy.md). Runtime reads **materialized rows**; refresh is **async job**.

---

## 4. When to use “real” algorithms

Invest extra design when **asymptotics or correctness** matter:

| Problem | Approach | Example in repo |
|---------|----------|-----------------|
| Date series with gaps | Window / nearest-neighbor within tolerance | `pickClosestToOffset` in macro series route |
| Composite scoring | Pure function, testable | `composite.ts` |
| GL-RTS scoring | Deterministic lookup table | `scoreGlRts` (Task 5) |
| Trigger cooldown | Time-window dedup | `cooldown.ts` |
| Ingest dedup | Unique key + upsert | `market_ohlcv_daily` PK (planned) |
| Drift % | Single pass over holdings | v2 domain (planned) |
| Backtest equity curve | Event-sorted daily loop | v3 worker (planned) |

**Skip heavy algorithms** when `n < 20` and clarity beats micro-optimization — but still **O(n)** not **O(n²)** without reason.

---

## 5. Caching stack (in order)

1. **Postgres** — source of truth, indexes for read paths  
2. **Application cache** — short TTL for macro snapshot (15m KST) until DB ETL live  
3. **CDN / ISR** — **not** for authenticated or personalized macro (use `force-dynamic`)  
4. **Redis** (optional v2+) — cross-instance macro snapshot if multi-region  

Always expose **observation date / ingested_at** in API when data can be stale.

---

## 6. Medium-term investments worth extra effort (approve early)

| Investment | Why now |
|------------|---------|
| `macro_observation` + daily ETL | Removes user-path upstream dependency |
| `ingest_job` queue + worker | OHLCV scale without Vercel timeout |
| Domain extract (`src/domains/*`) | Test + replace macro engine without UI churn |
| DB indexes on FK + date columns | Cheaper than app-layer hacks |
| Batch safety filter short-circuit | Already partially done — extend to narration output |
| Proper indexes on `aurora_narration_log(as_of_date)` | Narration cache lookup |

**Defer only** with explicit entry in journal + roadmap (not silent TODO).

---

## 7. React / Next.js performance

- **Server Components** default; client only for interactivity (chat, SWR sparkline).
- **SWR** `dedupingInterval` on series fetch (IndicatorCard) — keep ≥ 5m for same code.
- **No waterfall**: fetch tier + macro in parallel in layout/page where independent.
- **Bundle**: dynamic import for heavy chart libs if bundle grows (Recharts).
- React 19 ESLint strict rules — refactor over disable ([`dependency-upgrades.md`](./dependency-upgrades.md)).

---

## 8. PR checklist (agent + human)

- [ ] Hot path identified — complexity noted if non-trivial  
- [ ] No upstream loop in user request handler  
- [ ] Tests for domain pure functions (Red→Green for new logic)  
- [ ] DB migration includes indexes for new query patterns  
- [ ] Staleness / error UX matches macro patterns  
- [ ] Option B copy unchanged  
- [ ] If slower approach chosen — **one sentence why** in PR body  

---

## 9. Anti-patterns (add to mental AO catalog)

| ID | Pattern |
|----|---------|
| **IP-1** | Live API fan-out per request |
| **IP-2** | Claude call without cache check |
| **IP-3** | Unbounded cron query |
| **IP-4** | O(n²) portfolio compare on every page load |
| **IP-5** | “We’ll optimize later” on v2 DP-1–3 without journal entry |

---

## Related

- [`tdd-ddd-playbook.md`](./tdd-ddd-playbook.md)  
- [`data-platform-strategy.md`](./data-platform-strategy.md)  
- [`agent-harness.md`](./agent-harness.md)  
- Vault drift: `26-sprint-0-w2-w5` §0a (implementation vs spec)
