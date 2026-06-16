# Domain modules (v2-engineering)

Incremental DDD layout — see [`docs/engineering/tdd-ddd-playbook.md`](../../docs/engineering/tdd-ddd-playbook.md).

| Context | Path | Status |
|---------|------|--------|
| Macro | `macro/` | POC re-export from `src/lib/macro` |
| Profile | `profile/` | GL-RTS scoring (Task 5 — Ray Green) |
| Principle | `principle/` | IPS wizard schema (C3) |
| Broker | `broker/` | Toss lab (deferred) |
| Pace | `pace/` | Shape C (deferred) |

**Rule:** `domain/` has no fetch, React, or Supabase imports.
