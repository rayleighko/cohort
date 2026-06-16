/**
 * Aurora 🕊 chat endpoint — POST { sessionId, message, composite? }.
 *
 * Tier 0 anonymous chat scaffold (Day 11 / W3 Day 1, pull-forward of W5 Day 4
 * chat full per operator decision). PIPA-safe: sessionId is client-generated
 * UUID held in sessionStorage; no auth identifier flows to Anthropic.
 *
 * Bidirectional 3-gate safety filter — Day 7 architecture extension:
 *   INPUT SIDE  — applySafetyFilter(message) BEFORE Claude call. ADVISORY_REQUEST
 *                 short-circuits to redirect (cost save + safety primacy);
 *                 Claude is never invoked on a user advisory request.
 *   OUTPUT SIDE — containsForbiddenOutput + applySafetyFilter(narration) AFTER
 *                 Claude call. Same 3-gate Day 7 inherited
 *                 (defense-in-depth, known limit per
 *                 [[aurora-narration-assistant-mode-safety-filter-limit]]).
 *
 * Persistence: 2 rows per success turn (user, assistant) at turn_index N, N+1.
 * On input-side redirect: 2 rows (user message + redirect assistant).
 * On output-side redirect: 2 rows (user message + redirect assistant).
 * On 503 Claude failure: 0 rows (no half-state).
 */
import { NextResponse, type NextRequest } from 'next/server';
import {
  callPersonaMultiTurn,
  COHORT_PERSONA_MODEL_FAST,
  getAnthropicClient,
  shouldUseSonnet,
} from '@/lib/claude/client';
import {
  applySafetyFilter,
  containsForbiddenOutput,
  COHORT_FALLBACK_REDIRECT,
  type ClassifierClient,
} from '@/lib/claude/safety-filter';
import {
  buildAuroraChatPrompt,
  MAX_HISTORY_LENGTH,
  type ChatMessage,
} from '@/lib/aurora/chat-prompt';
import { createAdminClient } from '@/lib/supabase/admin';
import { getServerPostHog } from '@/lib/analytics/posthog-server';
import type { MacroComposite, MacroZone } from '@/lib/macro/composite';
import {
  QUOTA_EXCEEDED_REDIRECT_KO,
  QUOTA_WARN_THRESHOLD,
  resolveUserTier,
  TIER_QUOTAS,
  tomorrowMidnightKstIso,
  type TierType,
} from '@/lib/aurora/chat-quota';
import { canUseLlmBeta } from '@/lib/companion/llm-beta-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHAT_UNAVAILABLE_KO =
  '[Aurora가 잠시 자리를 비웠습니다. 잠시 후 다시 시도해주세요.]';

// Input bounds — Tier 0 endpoint is unauthenticated, so untrusted input must
// not be allowed to inflate Anthropic prompts or amplify abuse vectors.
const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 1;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_INDICATORS = 16;
const MAX_CODE_LENGTH = 64;
const VALID_ZONES: ReadonlyArray<MacroZone> = [
  'dovish',
  'neutral-dovish',
  'neutral',
  'neutral-hawkish',
  'hawkish',
];

// Prompt-injection guards. composite is accepted from an unauthenticated Tier 0
// POST body and string fields are inlined verbatim into the Claude user-message
// preamble — every string field must be strictly shape-validated to deny
// "ignore previous instructions"-style payloads delivered via asOfDate /
// computedAt / keyDriver.code.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const INDICATOR_CODE_RE = /^[A-Z0-9_]{1,32}$/;

function isSessionId(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

function isMessageText(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    v.trim().length >= MIN_MESSAGE_LENGTH &&
    v.length <= MAX_MESSAGE_LENGTH
  );
}

function isComposite(v: unknown): v is MacroComposite {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (typeof o.score !== 'number' || !Number.isFinite(o.score)) return false;
  if (!VALID_ZONES.includes(o.zone as MacroZone)) return false;
  if (!o.keyDriver || typeof o.keyDriver !== 'object') return false;
  const kd = o.keyDriver as Record<string, unknown>;
  if (kd.source !== 'ecos' && kd.source !== 'fred') return false;
  if (typeof kd.code !== 'string') return false;
  if (kd.code.length === 0 || kd.code.length > MAX_CODE_LENGTH) return false;
  if (!INDICATOR_CODE_RE.test(kd.code)) return false;
  if (typeof kd.contribution !== 'number') return false;
  if (!Number.isFinite(kd.contribution)) return false;
  if (!Array.isArray(o.indicators)) return false;
  if (o.indicators.length === 0 || o.indicators.length > MAX_INDICATORS) {
    return false;
  }
  if (typeof o.computedAt !== 'string' || typeof o.asOfDate !== 'string') {
    return false;
  }
  if (!ISO_DATE_RE.test(o.asOfDate)) return false;
  if (!ISO_DATETIME_RE.test(o.computedAt)) return false;
  return true;
}

interface ChatTurnResponse {
  character: 'aurora';
  text: string;
  triggered: boolean;
  sessionId: string;
  turnIndex: number;
}

interface HistoryRow {
  turn_index: number;
  role: 'user' | 'assistant';
  text: string;
}

/**
 * Fetches the last MAX_HISTORY_LENGTH messages for a session, returned in
 * turn-index ascending order (oldest → newest) for the prompt builder.
 * Returns (lastTurnIndex=-1, fetchOk=true) when there are simply no prior
 * turns. Returns fetchOk=false ONLY on an actual fetch error — the caller
 * must NOT proceed to insert at a guessed turn_index in that case.
 */
async function fetchHistory(
  sessionId: string,
): Promise<{
  history: ChatMessage[];
  lastTurnIndex: number;
  fetchOk: boolean;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('aurora_chat')
    .select('turn_index, role, text')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: false })
    .limit(MAX_HISTORY_LENGTH);
  if (error) {
    console.error('[Cohort] aurora_chat history fetch failed', error);
    return { history: [], lastTurnIndex: -1, fetchOk: false };
  }
  const rows = (data ?? []) as HistoryRow[];
  if (rows.length === 0) {
    return { history: [], lastTurnIndex: -1, fetchOk: true };
  }
  const lastTurnIndex = rows[0].turn_index;
  const history: ChatMessage[] = rows
    .slice()
    .reverse()
    .map((r) => ({ role: r.role, text: r.text }));
  return { history, lastTurnIndex, fetchOk: true };
}

/**
 * Best-effort dual insert of (user turn, assistant turn). Mirrors the Day 9
 * persistence pattern: failures log + flip persistenceFailed flag but never
 * block the 200 response. The two rows share session_id and have consecutive
 * turn_index values.
 */
async function persistTurnPair(input: {
  sessionId: string;
  userTurnIndex: number;
  userText: string;
  assistantTurnIndex: number;
  assistantText: string;
  assistantTriggered: boolean;
  safetyCategory: string | null;
}): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('aurora_chat').insert([
      {
        session_id: input.sessionId,
        turn_index: input.userTurnIndex,
        role: 'user',
        text: input.userText,
        character: 'aurora',
        safety_filter_triggered: false,
      },
      {
        session_id: input.sessionId,
        turn_index: input.assistantTurnIndex,
        role: 'assistant',
        text: input.assistantText,
        character: 'aurora',
        safety_filter_triggered: input.assistantTriggered,
        safety_filter_category: input.safetyCategory,
      },
    ]);
    if (error) {
      console.error('[Cohort] aurora_chat insert failed', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Cohort] aurora_chat insert threw', err);
    return false;
  }
}

/**
 * Returns today's UTC ISO date — chat_quota_usage.date primary key second
 * component. Quota window aligns with Supabase server timezone (UTC), which
 * is acceptable for a soft cap (KST users get reset at 09:00 KST, not
 * midnight — surfaced in the redirect copy by saying "내일 reset" without
 * promising a clock).
 */
function todayUtcIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reads the message_count for (session_id, today) — Tier 0 anonymous quota
 * lookup. Returns 0 on no row (first turn) or any error (fail-open: a
 * Supabase blip should not lock users out of chat — the persistence write
 * has its own best-effort path).
 */
async function fetchTodayQuotaForSession(sessionId: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('chat_quota_usage')
      .select('message_count')
      .eq('session_id', sessionId)
      .eq('date', todayUtcIso())
      .maybeSingle();
    if (error) {
      console.error('[Cohort] chat_quota_usage fetch failed', error);
      return 0;
    }
    return (data?.message_count as number | undefined) ?? 0;
  } catch (err) {
    console.error('[Cohort] chat_quota_usage fetch threw', err);
    return 0;
  }
}

/**
 * Atomically increments quota counters for (session_id, today). Two-step
 * SELECT → UPDATE/INSERT because the partial UNIQUE index on (session_id,
 * date) isn't easily targetable via PostgREST onConflict. Race window is
 * narrow (single-user single-session typically) and the UNIQUE constraint
 * surfaces collisions as Postgres errors → caught + logged. Best-effort:
 * a quota write failure should not block the 200 response.
 */
async function incrementSessionQuota(
  sessionId: string,
  model: string,
): Promise<void> {
  const isHaiku = model === COHORT_PERSONA_MODEL_FAST;
  try {
    const admin = createAdminClient();
    const date = todayUtcIso();
    const { data: existing, error: selectError } = await admin
      .from('chat_quota_usage')
      .select('id, message_count, haiku_count, sonnet_count')
      .eq('session_id', sessionId)
      .eq('date', date)
      .maybeSingle();
    if (selectError) {
      console.error('[Cohort] chat_quota_usage upsert SELECT failed', selectError);
      return;
    }
    if (existing) {
      const row = existing as {
        id: string;
        message_count: number;
        haiku_count: number;
        sonnet_count: number;
      };
      const { error: updateError } = await admin
        .from('chat_quota_usage')
        .update({
          message_count: row.message_count + 1,
          haiku_count: row.haiku_count + (isHaiku ? 1 : 0),
          sonnet_count: row.sonnet_count + (isHaiku ? 0 : 1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (updateError) {
        console.error('[Cohort] chat_quota_usage UPDATE failed', updateError);
      }
      return;
    }
    const { error: insertError } = await admin
      .from('chat_quota_usage')
      .insert({
        session_id: sessionId,
        tier: 'tier_0',
        date,
        message_count: 1,
        haiku_count: isHaiku ? 1 : 0,
        sonnet_count: isHaiku ? 0 : 1,
      });
    if (insertError) {
      console.error('[Cohort] chat_quota_usage INSERT failed', insertError);
    }
  } catch (err) {
    console.error('[Cohort] chat_quota_usage upsert threw', err);
  }
}

/**
 * Emits per-tier quota PostHog events (vault 62 §1 Q4, 2026-05-25).
 *   - `chat_quota_hit`: fired when daily usage crosses 80% threshold OR
 *     equals the daily cap (threshold property = '80' | '100').
 *   - `chat_quota_blocked`: fired alongside the 429 when a request is
 *     refused for exceeding the cap.
 * Self-contained: gets + shuts down its own PostHog client to keep call
 * sites simple. Skips silently when PH is disabled or tier is unlimited.
 */
async function emitQuotaEvent(input: {
  sessionId: string;
  userId: string | null;
  tier: TierType;
  dailyCount: number;
  dailyLimit: number;
  blocked: boolean;
}): Promise<void> {
  if (!Number.isFinite(input.dailyLimit)) return;
  const ph = getServerPostHog();
  if (!ph) return;

  const ratio = input.dailyCount / input.dailyLimit;
  const threshold =
    ratio >= 1.0 ? '100' : ratio >= QUOTA_WARN_THRESHOLD ? '80' : null;
  const distinctId = input.userId ?? `aurora-chat-${input.sessionId}`;

  try {
    if (threshold) {
      ph.capture({
        distinctId,
        event: 'chat_quota_hit',
        properties: {
          tier: input.tier,
          daily_count: input.dailyCount,
          daily_limit: input.dailyLimit,
          threshold,
        },
      });
    }
    if (input.blocked) {
      ph.capture({
        distinctId,
        event: 'chat_quota_blocked',
        properties: {
          tier: input.tier,
          daily_count: input.dailyCount,
          daily_limit: input.dailyLimit,
        },
      });
    }
  } catch (err) {
    console.error('[Cohort] PostHog quota event emit failed (non-fatal)', err);
  } finally {
    try {
      await ph.shutdown();
    } catch (err) {
      console.error(
        '[Cohort] PostHog shutdown after quota emit failed (non-fatal)',
        err,
      );
    }
  }
}

async function emitPostHog(event: {
  sessionId: string;
  triggered: boolean;
  safetyCategory: string | null;
  side: 'input' | 'output' | 'pass';
  persistenceFailed?: boolean;
}): Promise<void> {
  const ph = getServerPostHog();
  if (!ph) return;
  try {
    ph.capture({
      // sessionId is anonymous opaque UUID; safe as PostHog distinctId.
      distinctId: `aurora-chat-${event.sessionId}`,
      event: 'aurora_chat_turn',
      properties: {
        character: 'aurora',
        triggered: event.triggered,
        safety_filter_side: event.side,
        safety_filter_category: event.safetyCategory,
      },
    });
    if (event.persistenceFailed) {
      ph.capture({
        distinctId: `aurora-chat-${event.sessionId}`,
        event: 'aurora_chat_persistence_failed',
        properties: { character: 'aurora' },
      });
    }
  } catch (err) {
    console.error('[Cohort] PostHog capture failed (non-fatal)', err);
  } finally {
    try {
      await ph.shutdown();
    } catch (err) {
      console.error('[Cohort] PostHog shutdown failed (non-fatal)', err);
    }
  }
}

function noStoreJson(
  payload: unknown,
  init?: { status?: number },
): NextResponse {
  const res = NextResponse.json(payload, init);
  res.headers.set('cache-control', 'no-store');
  return res;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!canUseLlmBeta('chat')) {
    return noStoreJson(
      {
        error: 'llm_beta_disabled',
        text:
          'AI Beta 채팅은 현재 꺼져 있어요. 페이스 컴패니언(버튼·키워드)을 이용해 주세요.',
      },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson({ error: 'invalid_body' }, { status: 400 });
  }

  const body = raw as {
    sessionId?: unknown;
    message?: unknown;
    composite?: unknown;
  };

  if (!isSessionId(body.sessionId)) {
    return noStoreJson({ error: 'invalid_session_id' }, { status: 400 });
  }
  if (!isMessageText(body.message)) {
    return noStoreJson({ error: 'invalid_message' }, { status: 400 });
  }
  if (body.composite !== undefined && !isComposite(body.composite)) {
    return noStoreJson({ error: 'invalid_composite' }, { status: 400 });
  }

  const sessionId = body.sessionId;
  const userMessage = body.message.trim();
  const composite = body.composite as MacroComposite | undefined;

  // Step 1 — input-side safety filter. ADVISORY_REQUEST short-circuits BEFORE
  // any Claude call (Day 11 cost + safety: no Claude invocation on advisory).
  const anthropic = getAnthropicClient();
  const inputFilter = await applySafetyFilter(
    userMessage,
    anthropic as unknown as ClassifierClient,
  );

  // Single fetch — both lastTurnIndex (for new row indices) and history (for
  // prompt build) come from the same call to avoid 2× DB latency and to keep
  // both views of state consistent.
  const { history, lastTurnIndex, fetchOk } = await fetchHistory(sessionId);
  const userTurnIndex = lastTurnIndex + 1;
  const assistantTurnIndex = userTurnIndex + 1;

  // History fetch errored → refuse to write at potentially-colliding indices.
  // Returning 503 here is safer than blindly inserting at turn_index 0 over
  // existing rows (compounds with the UNIQUE(session_id, turn_index) guard
  // in migration 0005).
  if (!fetchOk) {
    return noStoreJson(
      {
        error: 'chat_unavailable',
        text: CHAT_UNAVAILABLE_KO,
        retryHint: 'Try again in a few minutes.',
      },
      { status: 503 },
    );
  }

  if (inputFilter.decision === 'BLOCK') {
    const redirectText = inputFilter.redirectText ?? COHORT_FALLBACK_REDIRECT;
    const persistOk = await persistTurnPair({
      sessionId,
      userTurnIndex,
      userText: userMessage,
      assistantTurnIndex,
      assistantText: redirectText,
      assistantTriggered: true,
      safetyCategory: inputFilter.category,
    });
    await emitPostHog({
      sessionId,
      triggered: true,
      safetyCategory: inputFilter.category,
      side: 'input',
      persistenceFailed: !persistOk,
    });
    const response: ChatTurnResponse = {
      character: 'aurora',
      text: redirectText,
      triggered: true,
      sessionId,
      turnIndex: assistantTurnIndex,
    };
    return noStoreJson(response);
  }

  // Step 1.5 — per-tier quota check (vault 62 §1 Q3, 2026-05-25). Inserted
  // AFTER input filter so safety primacy holds (Layer 1/2 always run, see
  // Day 11 architecture); inserted BEFORE persona call so quota-exhausted
  // users don't waste Sonnet/Haiku dollars. Input-side BLOCK already
  // returned above (those don't count toward quota — Layer 1/2 filter
  // rejection is system-side, not user consumption).
  //
  // Chat is anonymous in V1; userId stays null until W5 Wed auth wiring
  // lands. resolveUserTier(null) → 'tier_0', daily cap 5.
  const userId: string | null = null;
  const userTier = await resolveUserTier(userId);
  const tierLimits = TIER_QUOTAS[userTier];
  const usedToday = await fetchTodayQuotaForSession(sessionId);

  if (usedToday >= tierLimits.daily) {
    await emitQuotaEvent({
      sessionId,
      userId,
      tier: userTier,
      dailyCount: usedToday,
      dailyLimit: tierLimits.daily,
      blocked: true,
    });
    const text = QUOTA_EXCEEDED_REDIRECT_KO;
    const persistOk = await persistTurnPair({
      sessionId,
      userTurnIndex,
      userText: userMessage,
      assistantTurnIndex,
      assistantText: text,
      assistantTriggered: false,
      safetyCategory: null,
    });
    await emitPostHog({
      sessionId,
      triggered: false,
      safetyCategory: null,
      side: 'pass',
      persistenceFailed: !persistOk,
    });
    return noStoreJson(
      {
        error: 'chat_quota_exceeded',
        character: 'aurora',
        text,
        triggered: false,
        sessionId,
        turnIndex: assistantTurnIndex,
        tier: userTier,
        daily_count: usedToday,
        daily_limit: tierLimits.daily,
        reset_at: tomorrowMidnightKstIso(),
      },
      { status: 429 },
    );
  }

  // 80% warning emit (request still proceeds — quota_hit is informational).
  if (usedToday >= tierLimits.daily * QUOTA_WARN_THRESHOLD) {
    await emitQuotaEvent({
      sessionId,
      userId,
      tier: userTier,
      dailyCount: usedToday,
      dailyLimit: tierLimits.daily,
      blocked: false,
    });
  }

  // Step 2 — build prompt from history fetched above (single fetch reused).
  const { system, messages } = buildAuroraChatPrompt({
    history,
    newUserMessage: userMessage,
    composite,
  });

  // Step 3 — Claude call. Model is chosen per-turn via shouldUseSonnet
  // (vault 51 §4.4 cost optimization — Haiku default, Sonnet for framework
  // matching / macro deep-dive / behavioral nudge).
  const model = shouldUseSonnet(userMessage);
  const chosenModel = model
    ? 'claude-sonnet-4-6'
    : COHORT_PERSONA_MODEL_FAST;
  let narration: string;
  try {
    narration = await callPersonaMultiTurn(
      'aurora',
      system,
      messages,
      chosenModel,
    );
  } catch (err) {
    console.error('[Cohort] Aurora chat generation failed', err);
    return noStoreJson(
      {
        error: 'chat_unavailable',
        text: CHAT_UNAVAILABLE_KO,
        retryHint: 'Try again in a few minutes.',
      },
      { status: 503 },
    );
  }

  // Step 4 — output-side deterministic guard.
  if (containsForbiddenOutput(narration)) {
    console.error(
      '[Cohort] Aurora chat tripped forbidden-output guard — redirecting',
    );
    const text = COHORT_FALLBACK_REDIRECT;
    const persistOk = await persistTurnPair({
      sessionId,
      userTurnIndex,
      userText: userMessage,
      assistantTurnIndex,
      assistantText: text,
      assistantTriggered: true,
      safetyCategory: 'FORBIDDEN_OUTPUT',
    });
    await emitPostHog({
      sessionId,
      triggered: true,
      safetyCategory: 'FORBIDDEN_OUTPUT',
      side: 'output',
      persistenceFailed: !persistOk,
    });
    // Output-BLOCK still consumed a Claude call — count toward quota so
    // bad-actor users can't burn cost indefinitely on forbidden-output trips.
    await incrementSessionQuota(sessionId, chosenModel);
    const response: ChatTurnResponse = {
      character: 'aurora',
      text,
      triggered: true,
      sessionId,
      turnIndex: assistantTurnIndex,
    };
    return noStoreJson(response);
  }

  // Step 5 — output-side full 3-layer safety filter (defense-in-depth).
  const outputFilter = await applySafetyFilter(
    narration,
    anthropic as unknown as ClassifierClient,
  );

  let triggered = false;
  let text = narration;
  let safetyCategory: string | null = null;
  let side: 'input' | 'output' | 'pass' = 'pass';
  if (outputFilter.decision === 'BLOCK') {
    triggered = true;
    safetyCategory = outputFilter.category;
    text = outputFilter.redirectText ?? COHORT_FALLBACK_REDIRECT;
    side = 'output';
  }

  const persistOk = await persistTurnPair({
    sessionId,
    userTurnIndex,
    userText: userMessage,
    assistantTurnIndex,
    assistantText: text,
    assistantTriggered: triggered,
    safetyCategory,
  });

  await emitPostHog({
    sessionId,
    triggered,
    safetyCategory,
    side,
    persistenceFailed: !persistOk,
  });

  // Successful persona turn (or output-side filter BLOCK) — both consumed
  // a Claude call. Increment quota with the actual model used so the
  // haiku_count / sonnet_count breakdown is accurate for cost attribution.
  await incrementSessionQuota(sessionId, chosenModel);

  const response: ChatTurnResponse = {
    character: 'aurora',
    text,
    triggered,
    sessionId,
    turnIndex: assistantTurnIndex,
  };
  return noStoreJson(response);
}

