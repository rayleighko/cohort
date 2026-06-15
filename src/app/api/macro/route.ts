import { NextResponse } from 'next/server';
import { getMacroSnapshot } from '@/lib/macro/snapshot';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
