/**
 * Next.js root middleware — refreshes the Supabase auth session.
 * TODO(Day 2): gate the (dashboard) route group on an authenticated session.
 */
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except static assets, the SW, and image files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
