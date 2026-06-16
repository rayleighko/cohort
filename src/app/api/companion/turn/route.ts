/**
 * POST /api/companion/turn — rule-based pace companion ($0 LLM).
 *
 * Body: { message?, quickActionId?, composite? }
 * Returns Aurora template copy keyed by intent router.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { classifyLayer1 } from '@/lib/claude/safety-filter';
import { buildCompanionResponse } from '@/lib/companion/responses';
import { resolveCompanionIntent } from '@/lib/companion/intent-router';
import { loadUserCompanionContext } from '@/lib/companion/load-user-context';
import type { MacroComposite, MacroZone } from '@/lib/macro/composite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ZONES: ReadonlyArray<MacroZone> = [
  'dovish',
  'neutral-dovish',
  'neutral',
  'neutral-hawkish',
  'hawkish',
];

function isComposite(v: unknown): v is MacroComposite {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.score === 'number' &&
    Number.isFinite(o.score) &&
    VALID_ZONES.includes(o.zone as MacroZone) &&
    typeof o.asOfDate === 'string'
  );
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: {
    message?: string;
    quickActionId?: string;
    composite?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return noStoreJson({ error: 'invalid_json' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const quickActionId =
    typeof body.quickActionId === 'string' ? body.quickActionId : undefined;

  if (!message && !quickActionId) {
    return noStoreJson({ error: 'empty_input' }, { status: 400 });
  }
  if (message.length > 2000) {
    return noStoreJson({ error: 'message_too_long' }, { status: 400 });
  }

  const composite = isComposite(body.composite) ? body.composite : undefined;

  const layer1 = message ? classifyLayer1(message) : 'CLEAR_PASS';
  const layer1Advisory = layer1 === 'CLEAR_BLOCK';

  const intent = resolveCompanionIntent({
    message: message || undefined,
    quickActionId,
    layer1Advisory,
  });

  const userCtx = await loadUserCompanionContext();

  const text = buildCompanionResponse(intent, {
    composite,
    ips: userCtx.ips,
    triggers: userCtx.triggers,
  });
  const triggered = intent === 'advisory_redirect';

  return noStoreJson({
    character: 'aurora' as const,
    text,
    triggered,
    intent,
    mode: 'companion' as const,
  });
}
