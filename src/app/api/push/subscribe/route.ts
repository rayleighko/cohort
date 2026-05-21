import { NextResponse } from 'next/server';

/**
 * Web Push subscription endpoint. TODO(W4): persist subscription to push_subscription.
 */
export async function POST() {
  return NextResponse.json({ todo: 'W4 — push subscribe' }, { status: 501 });
}
