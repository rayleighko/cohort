/**
 * Shape C — Trigger CRUD API (W4 Mon)
 *
 * GET    /api/trigger          → list user's active triggers
 * POST   /api/trigger          → create trigger
 * PATCH  /api/trigger?id=<id>  → update trigger (partial)
 * DELETE /api/trigger?id=<id>  → soft-delete (is_active = false)
 *
 * RLS ensures owner-only access at the DB layer.
 * V1 scope: price_drop + macro_composite only.
 * V1.5 deferred: disclosure + composite (accepted by schema, eval returns false).
 *
 * Option B: response bodies NEVER contain timing/buy advice.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/types/database';
import type { ShapeCTriggerInsert, ShapeCTriggerUpdate, TriggerType } from '@/types/trigger';

const VALID_TRIGGER_TYPES: TriggerType[] = [
  'price_drop',
  'macro_composite',
  'disclosure',
  'composite',
];

const COOLDOWN_MIN = 1;
const COOLDOWN_MAX = 168;

// ── GET — list triggers ───────────────────────────────────────────────────────

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('shape_c_triggers')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ triggers: data }, { headers: { 'Cache-Control': 'no-store' } });
}

// ── POST — create trigger ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Partial<ShapeCTriggerInsert>;
  try {
    body = (await request.json()) as Partial<ShapeCTriggerInsert>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.trigger_type || !VALID_TRIGGER_TYPES.includes(body.trigger_type)) {
    return NextResponse.json(
      {
        error: 'invalid_trigger_type',
        detail: `trigger_type must be one of: ${VALID_TRIGGER_TYPES.join(', ')}`,
      },
      { status: 400 },
    );
  }

  if (!body.condition_params || typeof body.condition_params !== 'object') {
    return NextResponse.json(
      { error: 'invalid_condition_params', detail: 'condition_params must be an object' },
      { status: 400 },
    );
  }

  const cooldown = body.cooldown_hours ?? 24;
  if (cooldown < COOLDOWN_MIN || cooldown > COOLDOWN_MAX) {
    return NextResponse.json(
      {
        error: 'invalid_cooldown_hours',
        detail: `cooldown_hours must be between ${COOLDOWN_MIN} and ${COOLDOWN_MAX}`,
      },
      { status: 400 },
    );
  }

  const insert = {
    user_id: user.id,
    trigger_type: body.trigger_type,
    condition_params: body.condition_params as unknown as Json,
    cooldown_hours: cooldown,
    is_active: true,
    label: body.label ?? null,
  };

  const { data, error } = await supabase
    .from('shape_c_triggers')
    .insert(insert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ trigger: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

// ── PATCH — update trigger ────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'missing_id', detail: 'id query param required' }, { status: 400 });
  }

  let body: Partial<ShapeCTriggerUpdate>;
  try {
    body = (await request.json()) as Partial<ShapeCTriggerUpdate>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (body.trigger_type !== undefined && !VALID_TRIGGER_TYPES.includes(body.trigger_type)) {
    return NextResponse.json(
      { error: 'invalid_trigger_type', detail: `Must be one of: ${VALID_TRIGGER_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  if (body.cooldown_hours !== undefined) {
    if (body.cooldown_hours < COOLDOWN_MIN || body.cooldown_hours > COOLDOWN_MAX) {
      return NextResponse.json(
        {
          error: 'invalid_cooldown_hours',
          detail: `cooldown_hours must be between ${COOLDOWN_MIN} and ${COOLDOWN_MAX}`,
        },
        { status: 400 },
      );
    }
  }

  const allowedFields: (keyof ShapeCTriggerUpdate)[] = [
    'trigger_type',
    'condition_params',
    'cooldown_hours',
    'is_active',
    'label',
  ];

  const patch: Partial<ShapeCTriggerUpdate> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      (patch as Record<string, unknown>)[field] = body[field];
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: 'no_fields', detail: 'At least one field required' },
      { status: 400 },
    );
  }

  const dbUpdate: Database['public']['Tables']['shape_c_triggers']['Update'] = {
    ...(patch.trigger_type !== undefined && { trigger_type: patch.trigger_type }),
    ...(patch.condition_params !== undefined && {
      condition_params: patch.condition_params as unknown as Json,
    }),
    ...(patch.cooldown_hours !== undefined && { cooldown_hours: patch.cooldown_hours }),
    ...(patch.is_active !== undefined && { is_active: patch.is_active }),
    ...(patch.label !== undefined && { label: patch.label }),
  };

  const { data, error } = await supabase
    .from('shape_c_triggers')
    .update(dbUpdate)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ trigger: data }, { headers: { 'Cache-Control': 'no-store' } });
}

// ── DELETE — soft-delete trigger ──────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'missing_id', detail: 'id query param required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('shape_c_triggers')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true }, { headers: { 'Cache-Control': 'no-store' } });
}
