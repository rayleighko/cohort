import { NextResponse } from 'next/server';

/**
 * Trigger CRUD + evaluation (Shape C). TODO(W4): trigger_config CRUD + engine.
 */
export async function GET() {
  return NextResponse.json({ todo: 'W4 — trigger CRUD' }, { status: 501 });
}
