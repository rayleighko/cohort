---
name: aurora-chat-bidirectional-safety-filter
description: Day 11 Aurora chat surface evolution beyond Day 7 narration — bidirectional (input + output) 3-gate safety filter with input-side cost short-circuit
metadata:
  type: project
  created_at: 2026-05-24
  source_commit: 309f6ca
  parent_ref: dual-mascot-safety-filter (Day 4) + aurora-narration-assistant-mode-safety-filter-limit (Day 7)
---

Day 11 (W3 Day 1) Aurora chat scaffold ship 시 architectural 결정: chat surface는 narration보다 위험 (user free-form input → assistant prose 양방향 가능성). **Bidirectional 3-gate safety filter** 적용 — input + output 양쪽 모두.

## Why bidirectional (Day 7 narration과 차이)

- **Day 7 narration**: server → user 단방향. Assistant output only filter (defense-in-depth per [[aurora_narration_assistant_mode_safety_filter_limit]])
- **Day 11 chat**: user → server → assistant 양방향. **User input ADVISORY_REQUEST + assistant output Option B compliance** 둘 다 filter 통과 의무

User input filter는 **defensive safeguard가 아닌 architectural intent** — 14-arch §14.4 Layer 1 ADVISORY_TRIGGER_PATTERNS regex가 원래 user input 분류용으로 설계됨. Day 11 chat은 그 native intent 적용.

## Architecture (Day 11 commit 309f6ca)

`src/app/api/aurora/chat/route.ts` (441 LOC) flow:

```
1. Request body validation (sessionId UUID, message length, composite shape)
   ↓
2. INPUT-SIDE applySafetyFilter(message) — Layer 1 regex + Layer 2 Haiku + Layer 3 redirect
   - Layer 1 catch (ADVISORY_TRIGGER_PATTERNS regex):
     → 즉시 redirect template 반환
     → callPersonaMultiTurn NEVER invoked (cost saving + safety primacy)
     → 2 rows persisted (user message + assistant redirect)
   - Layer 1 AMBIGUOUS:
     → Layer 2 Haiku classifier
     → ADVISORY_REQUEST → redirect (callPersona X)
     → OTHER categories → proceed to step 3
   ↓
3. Fetch last 20 messages from aurora_chat (session_id, ORDER BY turn_index DESC)
   ↓
4. buildAuroraChatPrompt → Claude sonnet-4-6 callPersonaMultiTurn
   ↓
5. OUTPUT-SIDE 3-gate defense-in-depth (Day 7 inherited):
   - System prompt self-policing (~95%+)
   - containsForbiddenOutput deterministic regex (~99%+)
   - applySafetyFilter Layer 1/2 defensive third gate
   ↓
6. Insert 2 rows (user @ turn_index N, assistant @ turn_index N+1)
   ↓
7. Return { text, triggered, sessionId, turnIndex }
8. PostHog event: aurora_chat_turn (sessionId hashed, role, triggered, safety_filter_category, safety_filter_side)
```

## Input-side cost short-circuit pattern

**Cost + safety primacy**: User ADVISORY_REQUEST 감지 시 **Claude API call 생략**. 이유:
- Cost: Claude sonnet-4-6 input + output token + Layer 2 Haiku classifier token (~3 API calls per ambiguous turn). User가 명백한 advisory request인데 Claude까지 가면 비용 낭비 + safety filter Layer 3 redirect template으로 어차피 답변 대체됨
- Safety primacy: User advisory request에는 Aurora가 어떤 답도 generate하지 않음. Layer 3 redirect template만 답 (정보 + 도구 + 본인 plan reference로 redirect)

```typescript
// route.ts 패턴 (simplified)
const inputFilter = await applySafetyFilter(message);
if (inputFilter.action === 'BLOCK') {
  // Skip Claude API entirely — redirect immediately
  await persistTurn(sessionId, message, COHORT_FALLBACK_REDIRECT, true, inputFilter.category);
  return { text: COHORT_FALLBACK_REDIRECT, triggered: true, side: 'input' };
}
// Otherwise proceed to Claude + output-side filter
```

## Cost contract per turn

| Turn type | Layer 1 regex | Layer 2 Haiku | Claude sonnet-4-6 | Total API calls |
|---|---|---|---|---|
| Clear non-advisory user (most common) | 1× (input) + 1× (output) | 0 | 1× (assistant) | 1 |
| Ambiguous user → safe | 1× (input) | 1× (input classifier) | 1× (assistant) | 2 |
| Ambiguous user → ADVISORY | 1× (input) | 1× (input classifier) | 0 (short-circuit) | 1 |
| Clear advisory user (regex catch) | 1× (input) | 0 | 0 (short-circuit) | 0 (Claude 비용 0) |
| Aurora soft-phrasing output catch | 1× (input) | 0 or 1× (input) | 1× (assistant) + maybe 1× (output classifier) | 2-3 |

Net Sprint 0 Anthropic cost: Day 7 narration (1 call per page load per 1h SWR) + Day 11 chat (~1-2 calls per chat turn) = 합리적.

## False-positive / false-negative tradeoff (4 outcomes)

| User intent | Assistant intent | Filter outcome | Acceptable? |
|---|---|---|---|
| Safe educational ("매크로 score 어떻게 봐요?") | Safe response | Pass through | ✅ |
| Advisory ("지금 매수해야?") | Would-be redirect | Layer 1/2 catch input → redirect, no Claude call | ✅ ideal |
| Safe edu | Aurora soft phrasing slip ("비중 늘려봐") | Layer 2/3 output catch → redirect | ✅ defense-in-depth |
| Safe edu | False-positive on output | Aurora's neutral phrasing blocked → redirect template | ⚠ acceptable (never Option B leak) |
| Advisory question, regex misses | Aurora answers advisory | ❌ leak | ❌ unacceptable — [[aurora_narration_assistant_mode_safety_filter_limit]] known limit, W4 safety-filter-tester re-run target |

## Persistence contract

`aurora_chat` table (migration 0005, Day 11 ship):
- 2 rows per turn (user @ N + assistant @ N+1) atomic
- UNIQUE(session_id, turn_index) constraint catches concurrent insert race
- Best-effort persistence: if INSERT fails after Claude call, 503 over guess pattern (see [[fetch_503_over_guess_pattern]])
- nullable user_id column (W5 Day 4 future-proof)

## W4 follow-up trigger

Day 7 [[aurora_narration_assistant_mode_safety_filter_limit]] queue + Day 11 chat surface application:
1. safety-filter-tester sub-agent re-run — assistant-mode patterns + chat-specific patterns (turn-taking, multi-turn context)
2. Layer 2 system prompt rewrite for assistant-mode classification + chat-context awareness
3. containsForbiddenOutput extension (soft-phrasing + conversational patterns)
4. regression test set extension (chat-specific cases)

## Cross-references

- [[dual_mascot_safety_filter]] — 3-gate base architecture (W1 Day 4 ship)
- [[aurora_narration_assistant_mode_safety_filter_limit]] — Day 7 output-side limit, W4 closure queue
- [[fetch_503_over_guess_pattern]] — Day 11 code-review surfaced pattern (sister memory)
- [[anonymous_session_uuid_pattern]] — Day 11 sessionId scope (sister memory)
- [[vault_sot_priority]] — Drift catalog #15/#16 (Day 11 ship)

Source commit: 309f6ca (Day 11 W3 Day 1 ship 2026-05-24)
