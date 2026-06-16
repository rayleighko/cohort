# Observability — What to Watch & When

> **v1 production:** PostHog + Sentry (already wired).  
> **v2 local learning:** Prometheus + Grafana (optional compose profile).  
> **v2+ production metrics:** Defer full Grafana until traffic justifies it — use Vercel + Supabase dashboards first.

---

## Layer model

| Layer | Tool | Primary questions |
|-------|------|-------------------|
| **Product** | PostHog | Funnel, feature use, quota hits, survey completion |
| **Errors** | Sentry | 5xx, Claude failures, unhandled client errors |
| **Uptime** | Vercel Analytics / cron logs | Cron 401? Deployment health |
| **DB** | Supabase dashboard | Slow queries, RLS denials, connection pool |
| **AI cost** | Custom log + Anthropic dashboard | Tokens/day, narration vs chat split |
| **Infra metrics** | Prometheus (local / Fly later) | Worker CPU, job queue depth |

---

## PostHog — event checklist

Already spec'd / partial:

| Event | Why it matters |
|-------|----------------|
| `survey_*` | Onboarding funnel |
| `aurora_narration_*` | Brief success/fail/stale |
| `chat_quota_hit` / `chat_quota_blocked` | Cost + tier pressure |
| `safety_filter_triggered` | Compliance signal |
| `trigger_fired` | Shape C value |

**Dashboard to build:** Weekly active → survey complete → dashboard view → chat message.

---

## Sentry — alert-worthy

| Issue | Action |
|-------|--------|
| Spike in `/api/aurora/narration` 503 | Check `ANTHROPIC_API_KEY`, rate limits |
| `/api/macro` timeout | ECOS/FRED upstream; cache TTL |
| Cron route 401 | `CRON_SECRET` mismatch Vercel ↔ env |
| Client hydration errors | Recent RSC/client boundary change |

**Rule:** Every new API route → tag `feature:macro|aurora|payment`.

---

## Prometheus / Grafana (local learning profile)

When running `docker compose --profile obs up`:

### Starter metrics to expose (v2)

| Metric | Type | Source |
|--------|------|--------|
| `http_request_duration_seconds` | histogram | Next.js middleware or API wrapper |
| `macro_fetch_total` | counter | ECOS/FRED success/fail labels |
| `claude_request_total` | counter | narration/chat |
| `cron_trigger_eval_duration` | histogram | Shape C cron |

### Grafana dashboards (study goals)

1. **API latency p95** — macro vs chat
2. **External dependency error rate** — ECOS, FRED, Anthropic
3. **Cron last success timestamp**

Production path: OpenTelemetry → Grafana Cloud **or** Vercel log drain — decide at v2 release review.

---

## On-call playbook (solo founder)

| Symptom | First look | Second look |
|---------|------------|-------------|
| Dashboard stale macro | Vercel function logs | `kst-dates.ts`, cache TTL |
| Aurora empty | Sentry 503 | Supabase `aurora_narration_log` |
| Users can't login | Supabase Auth status | middleware cookie |
| Triggers not firing | Cron logs | `trigger_config` + engine tests |

Log incidents in active [`../journal/`](../journal/) `JOURNAL.md` § Incidents.

---

## What we should have watched (retro template)

Use in journal when postmortem:

- Which metric would have caught this **1h earlier**?
- Missing alert or missing test?
- Option B / PIPA impact?
