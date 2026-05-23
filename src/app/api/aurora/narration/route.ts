/**
 * Aurora 🕊 narration endpoint — POST { composite, category?, indicator?, yesterday?, history? }.
 *
 * Tier 0 (no auth) — narration is a public surface. PIPA-safe: input is
 * aggregate market data only, no user identifier ever passed to Anthropic.
 *
 * Day 9 (W2 Day 4) evolution: 4 narration categories
 *   morning_brief (default, Day 7 backward compat) | single_indicator_focus
 *   | score_change | weekly_summary
 *
 * Flow: validate composite + per-category required fields → build prompts →
 * callPersona(sonnet-4-6) → containsForbiddenOutput deterministic guard →
 * applySafetyFilter 3-layer guard → best-effort aurora_narration_log INSERT
 * (service-role) → PostHog emit → JSON response.
 *
 * Safety filter direction reversal vs /api/mascot:
 *   /api/mascot — filter on USER message inbound (someone might ask for advice).
 *   /api/aurora/narration — filter on ASSISTANT output (Aurora might leak
 *     advisory phrasing despite system-prompt guardrails).
 *
 * Per operator decision Day 7 + memory [[dual-mascot-safety-filter]] +
 * [[aurora-narration-assistant-mode-safety-filter-limit]] (W4 closure).
 */
import { NextResponse, type NextRequest } from 'next/server';
import {
  callPersona,
  getAnthropicClient,
} from '@/lib/claude/client';
import {
  applySafetyFilter,
  containsForbiddenOutput,
  COHORT_FALLBACK_REDIRECT,
  type ClassifierClient,
} from '@/lib/claude/safety-filter';
import {
  buildAuroraNarrationPrompt,
  NARRATION_CATEGORIES,
  type AuroraNarrationInput,
  type NarrationCategory,
} from '@/lib/aurora/aurora-prompt';
import { createAdminClient } from '@/lib/supabase/admin';
import { getServerPostHog } from '@/lib/analytics/posthog-server';
import type {
  MacroComposite,
  MacroIndicator,
  MacroZone,
} from '@/lib/macro/composite';
import type { Json } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ZONES: ReadonlyArray<MacroZone> = [
  'dovish',
  'neutral-dovish',
  'neutral',
  'neutral-hawkish',
  'hawkish',
];

const NARRATION_UNAVAILABLE_KO =
  '[Aurora가 잠시 자리를 비웠습니다. 잠시 후 다시 시도해주세요.]';

// Bounds on the composite payload — Tier 0 endpoint is unauthenticated, so
// the input must not be allowed to inflate the Anthropic prompt.
const MAX_INDICATORS = 16;
const MAX_CODE_LENGTH = 64;
const MAX_MISSING_INDICATORS = 16;
// Bound history depth for weekly_summary — protects against unbounded
// prompt inflation even with valid composite payloads.
const MAX_HISTORY = 14;
const MIN_HISTORY = 3;

function isIndicator(v: unknown): v is MacroIndicator {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    (o.source === 'ecos' || o.source === 'fred') &&
    typeof o.code === 'string' &&
    o.code.length > 0 &&
    o.code.length <= MAX_CODE_LENGTH &&
    typeof o.latest === 'number' &&
    Number.isFinite(o.latest) &&
    typeof o.normalized === 'number' &&
    Number.isFinite(o.normalized) &&
    typeof o.weight === 'number' &&
    Number.isFinite(o.weight) &&
    typeof o.contribution === 'number' &&
    Number.isFinite(o.contribution)
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
  if (typeof kd.contribution !== 'number') return false;
  if (!Number.isFinite(kd.contribution)) return false;
  if (!Array.isArray(o.indicators)) return false;
  if (o.indicators.length === 0 || o.indicators.length > MAX_INDICATORS) {
    return false;
  }
  if (!o.indicators.every(isIndicator)) return false;
  if (typeof o.computedAt !== 'string' || typeof o.asOfDate !== 'string') {
    return false;
  }
  if (o.degraded !== undefined && typeof o.degraded !== 'boolean') return false;
  if (o.missingIndicators !== undefined) {
    if (!Array.isArray(o.missingIndicators)) return false;
    if (o.missingIndicators.length > MAX_MISSING_INDICATORS) return false;
    if (!o.missingIndicators.every((m) => typeof m === 'string')) return false;
  }
  return true;
}

function isCategory(v: unknown): v is NarrationCategory {
  return typeof v === 'string' && (NARRATION_CATEGORIES as readonly string[]).includes(v);
}

interface NarrationResponse {
  character: 'aurora';
  text: string;
  triggered: boolean;
  zone: MacroZone;
  category: NarrationCategory;
}

async function emitPostHog(event: {
  zone: MacroZone;
  triggered: boolean;
  category: NarrationCategory;
  safetyCategory: string | null;
  persistenceFailed?: boolean;
}): Promise<void> {
  // distinctId is a single anonymous bucket — Tier 0 surface. Person-level
  // breakdowns collapse; per-user identity lands W4 with chat surface.
  const ph = getServerPostHog();
  if (!ph) return;
  try {
    ph.capture({
      distinctId: 'aurora-narration-anon',
      event: 'aurora_narration_generated',
      properties: {
        character: 'aurora',
        zone: event.zone,
        triggered: event.triggered,
        category: event.category,
      },
    });
    if (event.triggered) {
      ph.capture({
        distinctId: 'aurora-narration-anon',
        event: 'aurora_narration_safety_triggered',
        properties: {
          character: 'aurora',
          zone: event.zone,
          category: event.category,
          safety_category: event.safetyCategory,
        },
      });
    }
    if (event.persistenceFailed) {
      ph.capture({
        distinctId: 'aurora-narration-anon',
        event: 'aurora_narration_persistence_failed',
        properties: {
          character: 'aurora',
          zone: event.zone,
          category: event.category,
        },
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

/**
 * Best-effort persistence of the narration. NEVER blocks the response: any
 * failure logs to console + flips the `persistenceFailed` flag for analytics
 * but the user-visible 200 path is unaffected (per operator decision Day 9).
 */
async function persistNarration(input: {
  category: NarrationCategory;
  composite: MacroComposite;
  text: string;
  triggered: boolean;
  safetyCategory: string | null;
}): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('aurora_narration_log').insert({
      category: input.category,
      character: 'aurora',
      composite_snapshot: input.composite as unknown as Json,
      text: input.text,
      triggered: input.triggered,
      safety_filter_category: input.safetyCategory,
    });
    if (error) {
      console.error('[Cohort] aurora_narration_log insert failed', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Cohort] aurora_narration_log insert threw', err);
    return false;
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
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson({ error: 'invalid_body' }, { status: 400 });
  }

  const body = raw as {
    composite?: unknown;
    category?: unknown;
    indicator?: unknown;
    yesterday?: unknown;
    history?: unknown;
  };
  if (!isComposite(body.composite)) {
    return noStoreJson({ error: 'invalid_composite' }, { status: 400 });
  }

  // Category default preserves Day 7 backward-compatible behavior.
  if (body.category !== undefined && !isCategory(body.category)) {
    return noStoreJson(
      { error: 'invalid_category', allowed: NARRATION_CATEGORIES },
      { status: 400 },
    );
  }
  const category: NarrationCategory = body.category ?? 'morning_brief';

  // Per-category required-field validation.
  const promptInput: AuroraNarrationInput = { category, composite: body.composite };
  if (category === 'single_indicator_focus') {
    if (!isIndicator(body.indicator)) {
      return noStoreJson(
        { error: 'invalid_indicator', detail: "category 'single_indicator_focus' requires a valid 'indicator' field" },
        { status: 400 },
      );
    }
    promptInput.indicator = body.indicator;
  }
  if (category === 'score_change') {
    if (!isComposite(body.yesterday)) {
      return noStoreJson(
        { error: 'invalid_yesterday', detail: "category 'score_change' requires a valid 'yesterday' composite" },
        { status: 400 },
      );
    }
    promptInput.yesterday = body.yesterday;
  }
  if (category === 'weekly_summary') {
    if (
      !Array.isArray(body.history) ||
      body.history.length < MIN_HISTORY ||
      body.history.length > MAX_HISTORY ||
      !body.history.every(isComposite)
    ) {
      return noStoreJson(
        {
          error: 'invalid_history',
          detail: `category 'weekly_summary' requires a 'history' array of ${MIN_HISTORY}-${MAX_HISTORY} composites`,
        },
        { status: 400 },
      );
    }
    promptInput.history = body.history;
  }

  // Defense-in-depth: route validates each required field above, so this
  // builder call should never throw in production — but a future drift
  // (e.g. a 5th category added to the builder without route validation)
  // would otherwise escape to Next.js's default 500 handler.
  let system: string;
  let user: string;
  try {
    ({ system, user } = buildAuroraNarrationPrompt(promptInput));
  } catch (err) {
    console.error(
      '[Cohort] buildAuroraNarrationPrompt threw (route validation drift)',
      err,
    );
    return noStoreJson(
      { error: 'invalid_category_input' },
      { status: 400 },
    );
  }

  let narration: string;
  try {
    narration = await callPersona('aurora', system, user);
  } catch (err) {
    console.error('[Cohort] Aurora narration generation failed', err);
    return noStoreJson(
      {
        error: 'narration_unavailable',
        text: NARRATION_UNAVAILABLE_KO,
        retryHint: 'Try again in a few minutes.',
      },
      { status: 503 },
    );
  }

  // Output-side guard 1 — deterministic forbidden-phrase check (no API call).
  if (containsForbiddenOutput(narration)) {
    console.error(
      '[Cohort] Aurora narration tripped forbidden-output guard — redirecting',
    );
    const text = COHORT_FALLBACK_REDIRECT;
    const persistOk = await persistNarration({
      category,
      composite: body.composite,
      text,
      triggered: true,
      safetyCategory: 'FORBIDDEN_OUTPUT',
    });
    await emitPostHog({
      zone: body.composite.zone,
      triggered: true,
      category,
      safetyCategory: 'FORBIDDEN_OUTPUT',
      persistenceFailed: !persistOk,
    });
    const response: NarrationResponse = {
      character: 'aurora',
      text,
      triggered: true,
      zone: body.composite.zone,
      category,
    };
    return noStoreJson(response);
  }

  // Output-side guard 2 — full 3-layer safety filter on generated text.
  // Layer 2 (Haiku) fails CLOSED to ADVISORY_REQUEST on error inside the
  // safety-filter module, so no need to wrap in additional try/catch.
  const anthropic = getAnthropicClient();
  const filter = await applySafetyFilter(
    narration,
    anthropic as unknown as ClassifierClient,
  );

  let triggered = false;
  let text = narration;
  let safetyCategory: string | null = null;
  if (filter.decision === 'BLOCK') {
    triggered = true;
    safetyCategory = filter.category;
    text = filter.redirectText ?? COHORT_FALLBACK_REDIRECT;
  }

  const persistOk = await persistNarration({
    category,
    composite: body.composite,
    text,
    triggered,
    safetyCategory,
  });

  await emitPostHog({
    zone: body.composite.zone,
    triggered,
    category,
    safetyCategory,
    persistenceFailed: !persistOk,
  });

  const response: NarrationResponse = {
    character: 'aurora',
    text,
    triggered,
    zone: body.composite.zone,
    category,
  };
  return noStoreJson(response);
}
