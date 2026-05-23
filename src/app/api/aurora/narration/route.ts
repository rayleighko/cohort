/**
 * Aurora 🕊 morning-brief narration endpoint — POST { composite }.
 *
 * Tier 0 (no auth) — narration is a public surface. PIPA-safe: input is
 * aggregate market data only, no user identifier ever passed to Anthropic.
 *
 * Flow: validate composite → build prompts → callPersona(sonnet-4-6) →
 * 3-layer safety filter on OUTPUT (input has no user message) → optional
 * containsForbiddenOutput guard → PostHog emit → JSON response.
 *
 * Safety filter direction reversal vs /api/mascot:
 *   /api/mascot — filter on USER message inbound (someone might ask for advice).
 *   /api/aurora/narration — filter on ASSISTANT output (Aurora might leak
 *     advisory phrasing despite system-prompt guardrails).
 *
 * Per operator decision Day 7 + memory [[dual-mascot-safety-filter]].
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
import { buildAuroraNarrationPrompt } from '@/lib/aurora/aurora-prompt';
import { getServerPostHog } from '@/lib/analytics/posthog-server';
import type {
  MacroComposite,
  MacroIndicator,
  MacroZone,
} from '@/lib/macro/composite';

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
// the input must not be allowed to inflate the Anthropic prompt. The Day 6
// /api/macro ISR snapshot returns exactly 4 indicators with short fixed codes.
const MAX_INDICATORS = 16;
const MAX_CODE_LENGTH = 64;
const MAX_MISSING_INDICATORS = 16;

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

interface NarrationResponse {
  character: 'aurora';
  text: string;
  triggered: boolean;
  zone: MacroZone;
}

async function emitPostHog(event: {
  zone: MacroZone;
  triggered: boolean;
  category: string | null;
}): Promise<void> {
  // distinctId is a single anonymous bucket because Day 7 narration is Tier 0
  // (unauthenticated). Event-level analytics aggregate correctly; person-level
  // breakdowns collapse — accept until W4 chat surface lands per-user identity.
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

  const body = raw as { composite?: unknown };
  if (!isComposite(body.composite)) {
    return noStoreJson({ error: 'invalid_composite' }, { status: 400 });
  }
  const composite = body.composite;

  const { system, user } = buildAuroraNarrationPrompt(composite);

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
    const response: NarrationResponse = {
      character: 'aurora',
      text: COHORT_FALLBACK_REDIRECT,
      triggered: true,
      zone: composite.zone,
    };
    await emitPostHog({
      zone: composite.zone,
      triggered: true,
      category: 'FORBIDDEN_OUTPUT',
    });
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
  let category: string | null = null;
  if (filter.decision === 'BLOCK') {
    triggered = true;
    category = filter.category;
    text = filter.redirectText ?? COHORT_FALLBACK_REDIRECT;
  }

  await emitPostHog({
    zone: composite.zone,
    triggered,
    category,
  });

  const response: NarrationResponse = {
    character: 'aurora',
    text,
    triggered,
    zone: composite.zone,
  };
  return noStoreJson(response);
}
