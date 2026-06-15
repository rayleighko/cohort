/**
 * Next.js root middleware — Supabase session refresh + route protection
 * + A/B variant assignment.
 *
 * - Unauthenticated user hitting a (dashboard) route → redirect to /login
 *   (with ?redirect=<original path> so login can return them).
 * - Authenticated user hitting /login or /signup → redirect to /dashboard.
 * - Tier 0 dashboard at / and marketing routes stay public.
 * - On the landing (/), assigns a sticky A/B variant cookie (W2 A/B prereq;
 *   Day 5b renders Version C regardless).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const AB_COOKIE = 'cohort-ab-variant';
const AB_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Random A/B/C assignment, evenly weighted. */
function assignAbVariant(): 'A' | 'B' | 'C' {
  const r = Math.random();
  if (r < 1 / 3) return 'A';
  if (r < 2 / 3) return 'B';
  return 'C';
}

/** Authenticated-only routes (the (dashboard) route group). */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/shape-a',
  '/shape-b',
  '/shape-c',
  '/onboarding',
  '/chat',
  '/settings',
];

/** Auth pages — redirect away if already signed in. */
const AUTH_PAGES = ['/login', '/signup'];

/** Builds a redirect response that carries over the refreshed auth cookies. */
function redirectWithCookies(url: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Gate protected routes.
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('redirect', pathname);
    return redirectWithCookies(url, response);
  }

  // Keep signed-in users out of the auth pages.
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return redirectWithCookies(url, response);
  }

  // Assign a sticky A/B variant on the landing page if not already set.
  // SameSite=Lax + not HttpOnly — the client reads it for PostHog attribution.
  if (pathname === '/' && !request.cookies.get(AB_COOKIE)) {
    response.cookies.set(AB_COOKIE, assignAbVariant(), {
      maxAge: AB_MAX_AGE,
      sameSite: 'lax',
      httpOnly: false,
      path: '/',
    });
  }

  return response;
}

export const config = {
  // Run on everything except static assets, the SW, and image files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
