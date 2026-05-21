import { NextResponse } from 'next/server';

/**
 * Macro data endpoint — ECOS + FRED fetch + composite score.
 * TODO(W2): return computeCompositeScore() output.
 */
export async function GET() {
  return NextResponse.json({ todo: 'W2 — macro composite' }, { status: 501 });
}
