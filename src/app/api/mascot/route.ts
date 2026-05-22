import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, callPersona } from '@/lib/claude/client';
import {
  applySafetyFilter,
  containsForbiddenOutput,
  COHORT_FALLBACK_REDIRECT,
  type ClassifierClient,
} from '@/lib/claude/safety-filter';
import { buildAuroraPrompt } from '@/lib/claude/aurora-prompt';
import { buildVesperPrompt } from '@/lib/claude/vesper-prompt';
import { redactPersonalInfo } from '@/lib/utils/pipa-redact';
import type { MascotCharacter } from '@/types/mascot';

/**
 * Aurora / Vesper chat endpoint — POST { message, character? }.
 *
 * Flow: auth → log user turn → PIPA-redact → 3-layer safety filter →
 * (BLOCK) redirect template OR (ALLOW) persona response → log mascot turn.
 *
 * Every Claude call is gated by applySafetyFilter. The user message is
 * PIPA-redacted BEFORE it ever reaches Anthropic. All mascot_chat writes
 * use the user's RLS-bound client (auth.uid() = user_id enforced by RLS).
 */

// W1: no user plan/watchlist context yet (W2+). The chat task template
// still answers education / 멘탈 관리 / plan-reference questions.
const USER_CONTEXT_PLACEHOLDER =
  '(W1 — 사용자 plan·watchlist 데이터는 W2부터 연결됩니다. 일반 정보·교육·본인 plan reference 질문에 답하세요.)';

export async function POST(request: NextRequest) {
  // (a) Authenticate.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Parse + validate body.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const body = raw as { message?: unknown; character?: unknown };
  const message =
    typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'empty_message' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'message_too_long' }, { status: 400 });
  }
  const character: MascotCharacter =
    body.character === 'vesper' ? 'vesper' : 'aurora';

  // (b) Log the user turn (RLS-bound — user_id must equal auth.uid()).
  await supabase.from('mascot_chat').insert({
    user_id: user.id,
    character,
    role: 'user',
    content: message,
  });

  // (c) PIPA redaction — strip phone/email/주민번호 BEFORE any Anthropic send.
  const redacted = redactPersonalInfo(message);

  // (d) 3-layer safety filter + (e) persona response.
  let assistantText: string;
  let triggered = false;
  let category: string | null = null;
  try {
    const anthropic = getAnthropicClient();
    const filter = await applySafetyFilter(
      redacted,
      anthropic as unknown as ClassifierClient,
    );

    if (filter.decision === 'BLOCK') {
      triggered = true;
      category = filter.category;
      assistantText = filter.redirectText ?? COHORT_FALLBACK_REDIRECT;
    } else {
      const systemPrompt =
        character === 'vesper'
          ? buildVesperPrompt('chat', USER_CONTEXT_PLACEHOLDER)
          : buildAuroraPrompt('chat', USER_CONTEXT_PLACEHOLDER);
      assistantText = await callPersona(character, systemPrompt, redacted);

      // Output-side guard — if advisory phrasing somehow leaked, redirect.
      if (containsForbiddenOutput(assistantText)) {
        console.error('[Cohort] persona output tripped the forbidden guard');
        triggered = true;
        category = 'ADVISORY_REQUEST';
        assistantText = COHORT_FALLBACK_REDIRECT;
      }
    }
  } catch (err) {
    console.error('[Cohort] /api/mascot failed', err);
    return NextResponse.json({ error: 'mascot_unavailable' }, { status: 502 });
  }

  // Log the mascot turn. safety_filter_category is NULL unless triggered.
  await supabase.from('mascot_chat').insert({
    user_id: user.id,
    character,
    role: 'mascot',
    content: assistantText,
    safety_filter_triggered: triggered,
    safety_filter_category: triggered ? category : null,
  });

  return NextResponse.json({
    character,
    content: assistantText,
    safety_filter_triggered: triggered,
  });
}
