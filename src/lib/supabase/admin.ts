/**
 * Supabase service-role client — server-only. Bypasses RLS.
 *
 * Used for the first-signup `user_profile` upsert: `user_profile` intentionally
 * has no INSERT RLS policy (25-spec §4 — only SELECT + UPDATE for the owner),
 * so profile rows are created server-side with the service role, scoped
 * explicitly to the authenticated user's id.
 *
 * NEVER import this into a client component.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      '[Cohort] admin client requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY',
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
