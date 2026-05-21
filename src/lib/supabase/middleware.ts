/**
 * Supabase auth middleware helper — refreshes the session cookie on each request
 * and returns the current user so the Next.js root middleware can gate routes.
 * @supabase/ssr 0.10.x modern getAll/setAll cookie API (not legacy get/set/remove).
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface SessionResult {
  /** Response carrying refreshed auth cookies — must be returned (or cookies copied). */
  response: NextResponse;
  /** Authenticated user, or null if no valid session. */
  user: User | null;
}

export async function updateSession(
  request: NextRequest,
): Promise<SessionResult> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the token with Supabase Auth (do not trust getSession()
  // alone in middleware). This also refreshes the session cookie when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
