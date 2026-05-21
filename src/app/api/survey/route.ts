import { NextResponse } from 'next/server';

/**
 * Onboarding survey submit. TODO(W4): write onboarding_response + classify sub-cluster.
 */
export async function POST() {
  return NextResponse.json({ todo: 'W4 — survey submit' }, { status: 501 });
}
