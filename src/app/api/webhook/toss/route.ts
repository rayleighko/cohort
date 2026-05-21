import { NextResponse } from 'next/server';

/**
 * Toss Payments webhook. TODO(Day 3): verify webhook signature, update subscription.
 */
export async function POST() {
  return NextResponse.json({ todo: 'Day 3 — Toss webhook' }, { status: 501 });
}
