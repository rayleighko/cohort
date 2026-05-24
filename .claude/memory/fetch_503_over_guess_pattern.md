---
name: fetch-503-over-guess-pattern
description: When DB fetch errors and continuing would require guessing state, return 503 instead of inserting at a guessed value — paired with UNIQUE constraint for defense-in-depth
metadata:
  type: feedback
  created_at: 2026-05-24
  source_commit: 309f6ca
  origin: Day 11 sub-task 11 code-review (engineering:code-review --effort high CONFIRMED finding)
---

When server-side state derivation requires reading prior state (e.g., `turn_index = MAX(prev) + 1`), and that fetch errors out, **return 503 instead of inserting at a guessed default**.

## Pattern principle

Server-side state mutations에서 **guessing state silently corrupts data**. Defensive pattern:

1. Fetch prior state explicitly (e.g., `SELECT MAX(turn_index)` 또는 last-N rows)
2. **If fetch fails or returns ambiguous**: return 5xx error (typically 503), **do NOT proceed with insert**
3. Pair with **DB-level constraint** (UNIQUE / EXCLUSION / CHECK) for defense-in-depth

이렇게 하면:
- API consumer는 명시적 error 받고 retry 가능
- DB constraint이 silent corruption을 hard error로 convert (Postgres UNIQUE violation)
- 두 layer가 함께 작동 — application layer guard + DB layer constraint

## Day 11 ship 사례 (commit 309f6ca, `src/app/api/aurora/chat/route.ts`)

**Concern**: chat turn `turn_index`는 prior turn 기반 (MAX + 1 또는 length + 1 derivation). Multi-tab / concurrent insert / fetch-error race condition 시 silent corruption 위험.

**Fix applied** (engineering:code-review --effort high CONFIRMED):

```typescript
// route.ts 패턴 (simplified)
const { data: history, error: fetchError } = await fetchHistory(sessionId);

if (fetchError || !history) {
  // ❌ ANTI-PATTERN: guess turn_index = 0 and proceed
  //    → concurrent inserts can collide, race silently
  
  // ✅ Pattern: 503 over guess
  console.error('[Cohort] aurora_chat fetch error', fetchError);
  return NextResponse.json(
    { error: 'service_unavailable' },
    { status: 503, headers: { 'cache-control': 'no-store' } }
  );
}

const nextTurnIndex = history.length > 0 ? history[history.length - 1].turn_index + 1 : 0;

// DB-level defense:
// CREATE UNIQUE INDEX ON aurora_chat (session_id, turn_index);
// → concurrent insert at same turn_index → Postgres unique violation → 503 또는 retry
```

**DB-level constraint** (migration 0005):
```sql
ALTER TABLE aurora_chat
  ADD CONSTRAINT aurora_chat_session_turn_unique UNIQUE (session_id, turn_index);
```

Application layer guard (503 over guess) + DB layer constraint (UNIQUE violation) = **both fail-fast**. Silent corruption 불가능.

## When to apply (future stateful endpoints)

이 pattern은 다음 endpoint 패턴에서 반복 적용 가능:
- **Multi-turn conversation**: turn_index increment (Day 11 chat — 이미 적용)
- **Versioned resource**: version_number = MAX + 1 (e.g., document edit history)
- **Sequence number**: order_id, ticket_number 등
- **Position / index**: list position, rank 등
- **Idempotency key generation**: hash of prior state

각 case에서:
1. Application layer: fetch fail → 5xx, NEVER guess
2. DB layer: UNIQUE / EXCLUSION constraint
3. Test coverage: fetch error case + concurrent insert race case

## Anti-patterns to avoid

❌ **Silent default on fetch fail**:
```typescript
const turn_index = history?.length ?? 0;  // 위험 — fetch fail 시 silent 0 collision
```

❌ **Retry on insert collision without explicit handling**:
```typescript
try {
  await insert(turn_index);
} catch (e) {
  await insert(turn_index + 1);  // 위험 — 무한 collision 가능
}
```

❌ **Optimistic insert without DB constraint**:
```typescript
await insert(turn_index);  // 위험 — concurrent insert가 same turn_index로 둘 다 success
```

✅ **Recommended**:
```typescript
const { data, error } = await fetchPriorState();
if (error || !data) return 503;
const nextValue = derive(data);
try {
  await insertWithConstraint(nextValue);
} catch (e) {
  if (isUniqueViolation(e)) return 503; // retry 또는 explicit error
  throw e;
}
```

## Day 11 code-review verbatim (Block A reference)

> *"UNIQUE(session_id, turn_index) converts concurrent-insert / fetch-error race from silent corruption into Postgres error → route 503"*

Pattern proven across Day 11 sub-task 11 code-review.

## Cross-references

- [[option-a-clean-break-w1-w2]] — defensive pattern philosophy (avoid silent failure)
- [[aurora-chat-bidirectional-safety-filter]] — Day 11 chat route uses this pattern (sister memory)
- [[anonymous-session-uuid-pattern]] — Day 11 sessionId validation (sister memory)
- [[ao-5-vault-wins]] — verify before act philosophy

Source commit: 309f6ca (Day 11 W3 Day 1 ship 2026-05-24)
