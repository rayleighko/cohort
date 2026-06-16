# Local Docker & Monorepo Evolution

> **Direction:** Stay **one Git repo**; add **compose services** for local parity. Split to `apps/` + `packages/` when v2 domain extraction hurts without it.

---

## Phase A — Compose for data layer (v2-5)

```yaml
# docker-compose.yml (repo root)
services:
  postgres:
    image: postgres:16-alpine
    ports: ["54322:5432"]
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cohort_dev
    volumes:
      - cohort_pg_data:/var/lib/postgresql/data

  # Optional: Redis for macro cache experiments
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    profiles: ["cache"]

  # Optional: observability learning stack
  prometheus:
    image: prom/prometheus:v2.53.0
    profiles: ["obs"]
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:11.0.0
    profiles: ["obs"]
    ports: ["3001:3000"]
    depends_on: [prometheus]

volumes:
  cohort_pg_data:
```

**Usage:**

```bash
docker compose up -d postgres          # daily dev
docker compose --profile obs up -d     # learn metrics locally
```

**Env:** `.env.local` → `DATABASE_URL=postgresql://postgres:postgres@localhost:54322/cohort_dev`  
Production remains **Supabase managed** — no Docker in Vercel path.

---

## Phase B — Monorepo-lite layout (target)

```
cohort/
  apps/
    web/                 # Next.js (move from root — v2 late)
  packages/
    macro-domain/
    profile-domain/
    broker-port/
  workers/
    backtest/            # Fly.io / Railway later
  docker/
    prometheus/
  docs/versions/
```

Migration: **strangler** — extract `packages/macro-domain` first; `apps/web` imports via `@cohort/macro-domain`.

---

## Phase C — Backtest worker (v3 / M4)

Separate **process**, same repo:

- `workers/backtest/Dockerfile`
- Deploy: Fly.io machine or Railway
- Input: job queue row in Postgres (`backtest_job`)
- No user-facing Next.js route for long jobs — poll status API

---

## Multi-repo (explicit non-goal for v2)

Separate repos only if:

- Open-source `broker-port` SDK, or
- Spring `profile-service` enterprise learning track (roadmap Lg3)

Until then: **monorepo + compose** reduces agent context loss.

---

## Review checklist (Docker PRs)

- [ ] No secrets in compose files
- [ ] Profiles for optional heavy services
- [ ] Documented ports in this file
- [ ] `.env.local.example` updated
