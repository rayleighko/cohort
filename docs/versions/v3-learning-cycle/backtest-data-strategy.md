# Backtest Data Strategy — Sources, Cost, Storage

> **Decision:** Ray 2026-06-12 — tiered free-first ingest into **our Postgres** for optimization & cache.  
> **Status:** Design (v3 / roadmap M4) · **Not production**

---

## Goal

- User portfolio backtest against **real historical OHLCV**
- **We hold data** in Supabase (`market_ohlcv_daily`) — dedupe, index, adj close, corporate actions (later)
- Minimize cost at V1 scale; upgrade vendor when usage proves value

---

## Industry pattern (how quant shops do it)

1. **Vendor API** → nightly ETL → **warehouse** (Postgres/Parquet)
2. **Backtest worker** reads warehouse only (never live API per bar)
3. **Universe expansion** lazy: user symbols + top indices first
4. **Adjustments:** split/dividend-adjusted close for accurate returns (Phase 2+)

Cohort fits **2** with serverless/worker on Fly later.

---

## Option comparison

| Source | Markets | Cost | Bulk store? | License / risk | Verdict |
|--------|---------|------|-------------|----------------|---------|
| **User CSV** | Any | $0 | User → our PG | User responsibility | **BT-0 MVP** |
| **FinanceDataReader** | KRX, US, indices | $0 | Yes via ETL | Scrapes Naver/KRX; ToS gray for commercial | **BT-1 KR daily** |
| **pykrx** | KRX detail | $0 | Yes via ETL | Same; polite rate limit | BT-1 alternate |
| **Alpha Vantage** | US global | Free 25 req/day; paid $50+/mo | Slow seed; paid bulk | [NASDAQ licensed vendor](https://www.alphavantage.co/) | **BT-1b US seed** |
| **yfinance** | Global | $0 | Unreliable scrape | Breaks often; not prod | Dev only |
| **Stooq manual ZIP** | US/JP/KR bulk | $0 manual | One-time import | CAPTCHA blocks auto since 2020 | **BT-2 backfill** |
| **EODHD** | Global 30y+ | ~$20/mo starter | API + bulk | Commercial-friendly | **BT-3 at scale** |
| **Polygon** | US pro | $199+/mo | S3 flat files | Licensed | Defer |
| **KRX official (KRX Data Marketplace)** | KR | Paid enterprise | Yes | Cleanest KR license | When revenue |

---

## Recommended phased rollout

### BT-0 — User CSV (ship first)

- Upload OHLCV CSV → validate → `user_price_import` staging → merge to user-scoped or symbol table
- **Zero vendor risk**; works for any market user cares about
- Schema:

```sql
-- illustrative
market_symbol (symbol, exchange, currency)
market_ohlcv_daily (symbol_id, trade_date, open, high, low, close, volume, source)
```

### BT-1 — KR nightly ETL (free)

- Worker cron (Fly/Railway or Vercel long job — **not** per-request):
  - Universe: KOSPI200 + user-held tickers from `watchlist` / portfolio
  - Fetch: `FinanceDataReader` `KRX:{code}` or pykrx `get_market_ohlcv`
  - Throttle: 1 req/s, backoff, idempotent upsert on `(symbol_id, trade_date)`
- **Disclaimer in UI:** reference data, not exchange official feed
- pykrx / FDR docs: [FinanceDataReader](https://pypi.org/project/finance-datareader/), [pykrx](https://pypi.org/project/pykrx/)

### BT-1b — US seed (free tier)

- Alpha Vantage `TIME_SERIES_DAILY_ADJUSTED` for **seed list** (SPY, QQQ, user symbols)
- 25 calls/day → ~25 symbols/day backfill; queue in `market_ingest_job`
- Upgrade to paid tier when queue SLA > 7 days

### BT-2 — Stooq one-time bulk (free, manual)

- Ray or ops downloads ZIP from [stooq.com/db](https://stooq.com/db/h/) manually (CAPTCHA)
- Import script → `market_ohlcv_daily` (US/JP; KR if available in bundle)
- Good for **5–10y backtest demo** without API burn

### BT-3 — Paid when justified

- Trigger: >500 daily ingest API calls OR need split-adjusted bulk OR commercial ToS requirement
- **EODHD** ~$19.99/mo often cited for backtest coverage vs Yahoo ([comparison articles 2025–2026](https://eodhd.com/financial-academy/fundamental-analysis-examples/beyond-yahoo-finance-api-alternatives-for-financial-data))
- Store everything we pay for — amortize over all users

---

## What we optimize by holding data

| Optimization | Needs local store |
|--------------|-------------------|
| Repeated backtest same symbol | Yes |
| Portfolio drift vs historical vol | Yes |
| Index constituent backtest | Yes + constituent table |
| Macro + equity combined timeline | Yes (macro already ECOS/FRED) |
| Reduced API cost at scale | Yes |

---

## Cohort constraints (Option B)

- Backtest output = **educational simulation** — no “you should have bought X”
- No implied performance promise
- User-entered cost basis for their book; market data separate

---

## Next engineering tasks (v3 prep)

1. ADR `003-market-data-ingest-tier`
2. Migration `market_symbol` + `market_ohlcv_daily`
3. `workers/ingest-market-daily` Docker image (see `docker-local.md`)
4. BT-0 CSV upload API + validation tests

---

## Answer: “무료만으로 가능한가?”

**Yes, for MVP and Korean retail focus** — with tradeoffs:

- KR daily OHLCV via FDR/pykrx ETL → **feasible free**, store in PG
- US coverage → free but **slow** (Alpha Vantage 25/day) or **manual Stooq bulk**
- Production-grade licensed KR feed → **paid** later
- **Best path:** BT-0 CSV + BT-1 KR ETL + lazy US seed; revisit EODHD when users > pivot threshold

**Platform principle (all domains):** [`../../engineering/data-platform-strategy.md`](../../engineering/data-platform-strategy.md)
