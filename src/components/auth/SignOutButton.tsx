'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Logout — clears Supabase auth session + redirects to landing.
 * Strategic Decision 0 Option B: 단순 "로그아웃" label, 권유 표현 X.
 * PIPA: signOut만 호출. 본인 데이터 삭제는 별도 surface (DeleteAccountButton).
 */
export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="min-h-[44px] w-full rounded-xl border border-cohort-charcoal/15 px-5 text-sm font-medium text-cohort-charcoal/70 disabled:opacity-50"
    >
      {loading ? '로그아웃 중…' : '로그아웃'}
    </button>
  );
}
