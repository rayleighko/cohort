import { NextResponse } from 'next/server';
import { getMacroSnapshot } from '@/lib/macro/snapshot';

/**
 * Macro snapshot endpoint — public Tier 0 (no auth). Returns the macro
 * composite + raw indicators. ISR-cached for 1 hour.
 *
 * Partial fetch failures degrade (200 with `composite.degraded: true`);
 * total failure (no indicators recoverable) returns 503 with retry hint.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const snapshot = await getMacroSnapshot();
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json(
      {
        error: 'macro_unavailable',
        retryHint: 'Try again in a few minutes.',
      },
      { status: 503 },
    );
  }
}
