/**
 * GET /api/principle/ips — latest active IPS document
 * POST /api/principle/ips — validate + persist new IPS version
 *
 * Auth required. Option B: user-authored document only.
 * Refs: docs/specs/ips-wizard.md §6, migration 0015
 */
import { NextResponse, type NextRequest } from 'next/server';
import { safeParseIpsDocument } from '@/domains/principle/domain/ips-schema';
import { loadActiveIps, saveActiveIps } from '@/lib/principle/ips-persistence';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function noStoreJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return noStoreJson({ error: 'unauthorized' }, { status: 401 });
  }

  const active = await loadActiveIps(supabase, user.id);
  if (!active) {
    return noStoreJson({ principle: null });
  }

  return noStoreJson({
    principle: {
      id: active.id,
      version: active.version,
      document: active.document,
      acknowledged_at: active.acknowledged_at,
      created_at: active.created_at,
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return noStoreJson({ error: 'unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = safeParseIpsDocument(raw);
  if (!parsed.success) {
    return noStoreJson(
      {
        error: 'invalid_document',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const saved = await saveActiveIps(supabase, user.id, parsed.data);
    return noStoreJson({
      id: saved.id,
      version: saved.version,
      acknowledged_at: saved.acknowledged_at,
      created_at: saved.created_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[Cohort] IPS save failed', message);
    return noStoreJson({ error: 'save_failed' }, { status: 500 });
  }
}
