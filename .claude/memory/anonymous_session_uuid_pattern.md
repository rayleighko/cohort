---
name: anonymous-session-uuid-pattern
description: Tier 0 anonymous session_id pattern — client-generated UUID via sessionStorage + RFC 4122 §4.4 fallback + nullable user_id for W5 Day 4 future-proof
metadata:
  type: project
  created_at: 2026-05-24
  source_commit: 309f6ca
  pattern_origin: Day 11 Aurora chat scaffold
---

Tier 0 anonymous session 식별 패턴 — client-generated UUID via sessionStorage + server-side UUID_RE validation + DB nullable user_id column for W5 Day 4 logged-in upgrade path.

## Pattern overview

Cohort Tier 0 (public surface, no auth)에서 anonymous user session 식별 필요 — Aurora chat persistence, future onboarding survey, future Vesper chat 등 cross-turn stateful surface 적용 가능.

**Architecture**:
1. **Client side (MascotChatBubble.tsx)**: `crypto.randomUUID()` 또는 RFC 4122 §4.4 fallback으로 UUID 생성 → `sessionStorage` persist
2. **Server side (/api/aurora/chat/route.ts)**: request body의 `sessionId` field validate via UUID_RE regex
3. **DB side (aurora_chat 0005)**: `session_id TEXT NOT NULL` + nullable `user_id UUID REFERENCES auth.users(id)` — Day 11 anonymous = user_id NULL, W5 Day 4 logged-in user는 user_id populated

## Day 11 implementation (commit 309f6ca)

### Client-side UUID generation (MascotChatBubble.tsx, 117 LOC)

```typescript
function generateSessionId(): string {
  // crypto.randomUUID() — modern browsers, secure context required
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // RFC 4122 §4.4 fallback — older browsers + non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''; // SSR guard
  let sid = sessionStorage.getItem('aurora_chat_session_id');
  if (!sid) {
    sid = generateSessionId();
    sessionStorage.setItem('aurora_chat_session_id', sid);
  }
  return sid;
}
```

**Why sessionStorage (not localStorage)**:
- Tab-scoped persistence — user closes tab → new session (cleanup automatic)
- PIPA compliant — no persistent user tracking across browser sessions
- Privacy preserve — incognito mode 자동 새 session
- W5 Day 4 logged-in upgrade 시 sessionStorage → server-side user_id 연결

**Why crypto.randomUUID() preferred**:
- Cryptographically secure random (vs Math.random() guessable)
- RFC 4122 compliant out-of-box (version 4 UUID)
- Single line, no fallback complexity (modern browsers)

**Why RFC 4122 §4.4 fallback**:
- crypto.randomUUID() unavailable in older browsers (Safari < 15.4, etc.) or non-secure contexts
- Pattern replaces only `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` template chars with random hex
- `4` in 3rd group fixes UUID version (v4 = random)
- `y` in 4th group = one of [8, 9, a, b] (version 4 variant bits)
- Result: RFC 4122 §4.4 compliant UUID v4

### Server-side validation (route.ts)

```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!UUID_RE.test(body.sessionId)) {
  return NextResponse.json(
    { error: 'invalid_session_id' },
    { status: 400 },
  );
}
```

**Why server-side validation**:
- Client UUID 생성 신뢰 안 함 — adversarial client는 invalid sessionId 보낼 수 있음
- SQL injection 방어 (UUID_RE regex match만 통과)
- Logging / analytics에 garbage sessionId 누적 방지

### DB schema (migration 0005)

```sql
CREATE TABLE aurora_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,        -- client-generated UUID via sessionStorage
  user_id UUID REFERENCES auth.users(id),  -- nullable, Day 11 anonymous = NULL, W5 Day 4 logged-in = populated
  turn_index INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  safety_filter_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  safety_filter_category TEXT,
  character TEXT NOT NULL DEFAULT 'aurora' CHECK (character IN ('aurora', 'vesper')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, turn_index)
);

ALTER TABLE aurora_chat ENABLE ROW LEVEL SECURITY;
-- Default-deny: no policies. Service-role insert only.
-- W5 Day 4: add SELECT policy "auth.uid() = user_id" for logged-in user history retrieval
```

## W5 Day 4 upgrade path (logged-in user)

Day 11 anonymous = `session_id` populated, `user_id` NULL. W5 Day 4 본격 chat full 시:

1. **Migration 0007 (또는 inline ALTER)**: SELECT policy 추가
   ```sql
   CREATE POLICY aurora_chat_user_read ON aurora_chat
     FOR SELECT USING (auth.uid() = user_id);
   ```
2. **Login flow**: 사용자 sign-in 후, sessionStorage sessionId를 server에 전달 → server가 aurora_chat의 prior rows에 user_id UPDATE (or anonymous → logged-in linking)
3. **Anonymous + logged-in 양립**: user_id NULL인 row는 Tier 0 anonymous chat (Day 11), user_id populated row는 logged-in user history

이렇게 하면 ALTER TABLE schema migration 없이 W5 Day 4 logged-in upgrade 가능 — Day 11에 nullable user_id column이 future-proof로 들어가 있음.

## Why this pattern (architectural reasoning)

**Tier 0 anonymous chat이 필요한 이유**:
- 사용자 첫 방문 시 즉시 Aurora chat 사용 — 회원가입 friction 회피
- Cluster B sophisticated retail은 첫 인상에서 "이게 작동하는지" 검증 — anonymous chat으로 즉시 가치 전달
- W2 mini-checkpoint (3 personal-network walkthrough) 시 anonymous chat이 흐름 단순

**Future migration (W5 Day 4 logged-in)이 필요한 이유**:
- 사용자가 plan 영역 만들고 saved/referenced — logged-in user의 chat history retrieval 필요
- 1:1 chat conversation history는 personalized 가치 큰 surface
- Long-term engagement metric (chat turn count per user)

**Nullable user_id가 두 시점 잇는 bridge**:
- Day 11 anonymous: schema 그대로 + user_id NULL
- W5 Day 4 logged-in: 같은 schema 사용, user_id populated, RLS SELECT policy 추가
- Zero schema migration cost between two phases — operational simplicity

## Reusable contexts (future surfaces)

이 pattern은 다음 surface에서 재사용 권장:
- **Vesper chat (W4)**: 동일 anonymous sessionId 패턴
- **Onboarding survey (W4-W5)**: 익명 응답자 식별 (Day 11 chat이 onboarding 진입점 가능)
- **Tier 0 dashboard preferences**: anonymous user의 watchlist sketch (W5 Day 4 logged-in 시 server migrate)
- **Future Tier 0 surfaces**: anonymous engagement metric trackable

## Anti-patterns to avoid

❌ **localStorage 사용**: persistent tracking → PIPA risk + privacy 위반
❌ **server-generated session token**: anonymous user에 cookie 발급 → 동일 PIPA risk + GDPR/PIPA consent 필요
❌ **IP-based session**: ephemeral + multi-user 같은 IP 충돌
❌ **device fingerprinting**: invasive + maintenance heavy
❌ **non-UUID session id**: SQL injection risk + format 비표준

## Cross-references

- [[aurora-chat-bidirectional-safety-filter]] — Day 11 chat route uses sessionId (sister memory)
- [[fetch-503-over-guess-pattern]] — Day 11 turn_index handling (sister memory)
- [[strategic-decision-0-option-b]] — anonymous chat 이 PIPA + Option B 둘 다 정합
- [[vault-sot-priority]] — Drift #15/#16 Day 11 ship reference

Source commit: 309f6ca (Day 11 W3 Day 1 ship 2026-05-24)
