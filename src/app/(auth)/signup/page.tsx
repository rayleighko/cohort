'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const INPUT_CLASS =
  'min-h-[44px] w-full rounded-xl border border-cohort-charcoal/15 bg-white px-4 text-base text-cohort-charcoal outline-none focus:border-cohort-primary';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email-verification link returns here; the route exchanges the code.
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      setError('가입에 실패했습니다. 이메일을 확인하거나 잠시 후 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold text-cohort-charcoal">
          확인 이메일을 보냈어요
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cohort-charcoal/70">
          <span className="font-semibold">{email}</span> 으로 인증 링크를
          보냈습니다. 이메일의 링크를 눌러 가입을 완료해주세요.
        </p>
        <p className="mt-2 text-sm text-cohort-charcoal/55">
          링크 확인 후 Cohort 온보딩으로 이동합니다.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-cohort-charcoal">회원가입</h1>
      <p className="mt-2 text-sm leading-relaxed text-cohort-charcoal/60">
        Top 5-10% sophisticated retail의 cohort에 합류하세요.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="비밀번호 (8자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLASS}
        />

        {error && (
          <p role="alert" className="text-sm text-cohort-primary">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] w-full rounded-xl bg-cohort-primary px-5 text-base font-semibold text-cohort-ivory disabled:opacity-60"
        >
          {loading ? '가입 중…' : '회원가입'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-cohort-charcoal/60">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-semibold text-cohort-primary">
          로그인
        </Link>
      </p>
    </main>
  );
}
