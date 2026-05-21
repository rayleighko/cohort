import { NextResponse } from 'next/server';

/**
 * Aurora / Vesper chat endpoint.
 * TODO(Day 4): Claude API call routed through the shared 3-layer safety filter
 * (src/lib/claude/safety-filter.ts); persist turns to mascot_chat with `character`.
 */
export async function POST() {
  return NextResponse.json(
    { todo: 'Day 4 — Aurora/Vesper chat + safety filter' },
    { status: 501 },
  );
}
