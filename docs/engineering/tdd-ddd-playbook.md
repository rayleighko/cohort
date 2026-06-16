# TDD + DDD Playbook (v2 operational)

> **Goal:** Learn by **doing** on Cohort — not textbook DDD. Start v2 on `version/v2-engineering`.

---

## DDD — lightweight for solo + agents

### Bounded contexts (see v2 ARCHITECTURE)

Place code under:

```
src/domains/
  macro/
    domain/       # pure: composite, dates
    application/  # snapshot orchestration
    infrastructure/ # ecos.ts, fred.ts
  profile/
  broker/
  pace/
```

**Rules:**

1. **Domain layer** — no `fetch`, no React, no Supabase imports.
2. **Application layer** — use cases; depends on domain + ports (interfaces).
3. **Infrastructure** — Supabase, HTTP clients implement ports.
4. **App router** — thin: calls application services only.

Migrate **incrementally** — first extract `macro/composite` (already pure) as pattern.

### Ubiquitous language (Korean product terms in code comments OK)

| Term | Meaning |
|------|---------|
| IPS | Investment Policy Statement — user-authored rules |
| Pace | User's DCA / rebalance rhythm (not AI timing) |
| Drift | Current vs target weights (user-defined targets) |
| Brief | Aurora macro narration for a date |
| Trigger | User-defined Shape C condition |

---

## TDD — what we actually run

### Pyramid for Cohort

| Layer | Tool | When |
|-------|------|------|
| Unit | Vitest | Domain pure functions (composite, scoreGlRts, drift calc) |
| Contract | Vitest + fixtures | API route request/response shape |
| Integration | Vitest + test DB (future) | RLS policies, survey persist |
| E2E | Playwright (deferred) | Critical path: login → dashboard |

### Red-green-refactor loop (agent task template)

1. Write failing test in `__tests__/` next to domain file.
2. Minimal implementation.
3. `npx vitest run <path>` green.
4. `npx tsc --noEmit`.
5. PR.

### Examples already in repo

- `src/lib/claude/__tests__/safety-filter.test.ts` — compliance gate
- `src/lib/macro/__tests__/composite.test.ts` — domain logic
- `scoreGlRts` — **Red waiting for Green** (Task 5)

### CI gate (V2-1)

```yaml
# .github/workflows/ci.yml (target)
- run: npx tsc --noEmit
- run: npx vitest run
- run: npm run lint
```

Pre-push hook remains; CI = **machine reviewer** for agent PRs.

---

## ADR (Architecture Decision Records)

When decision is irreversible or compliance-touching:

```
docs/versions/v2-engineering/adr/
  001-broker-port-read-only.md
  002-quiz-gate-soft-vs-hard.md
```

Template: Context → Decision → Consequences → Option B check.

---

## What we skip (scope cap)

- Event sourcing
- Full CQRS
- Microservices split before L4 order volume
- 100% coverage — target **domain + safety + payment** first
