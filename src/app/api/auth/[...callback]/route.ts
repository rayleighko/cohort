import { NextResponse } from 'next/server';

/**
 * Supabase Auth callback. TODO(Day 2): exchange code for session, redirect.
 */
export async function GET() {
  return NextResponse.json({ todo: 'Day 2 — Supabase Auth callback' }, { status: 501 });
}
