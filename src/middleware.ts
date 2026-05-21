/**
 * Next.js root middleware — Supabase session refresh + route protection.
 *
 * - Unauthenticated user hitting a (dashboard) route → redirect to /login
 *   (with ?redirect=<original path> so login can return them).
 * - Authenticated user hitting /login or /signup → redirect to /shape-a.
 * - Tier 0 dashboard at / and marketing routes stay public.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/** Authenticated-only routes (the (dashboard) route group). */
const PROTECTED_PREFIXES = [
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
    url.pathname = '/shape-a';
    url.search = '';
    return redirectWithCookies(url, response);
  }

  return response;
}

export const config = {
  // Run on everything except static assets, the SW, and image files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
