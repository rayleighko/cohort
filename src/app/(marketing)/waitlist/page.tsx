'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import MascotAvatar from '@/components/mascot/MascotAvatar';
import { posthog } from '@/lib/analytics/posthog';
import { getAbVariant } from '@/lib/analytics/ab';

/**
 * Waitlist signup form (pre-launch lead capture).
 *
 * Tokens (cohort-token-keeper): text-cohort-ink-90/70/50, bg-cohort-ivory,
 * bg-cohort-primary, border-cohort-ink-10/primary, text-cohort-warning (error).
 * Mobile-first single column, 44px+ touch, bottom-fixed submit.
 * Copy: Option B + Aurora tone (cohort-ux-copy). PIPA: explicit consent +
 * retention + 삭제 path stated; email → DB only, never to PostHog.
 */

type FormState = 'idle' | 'submitting' | 'subscribed' | 'already' | 'error';

const INPUT_CLASS =
  'min-h-[44px] w-full rounded-lg border border-cohort-ink-10 bg-white px-4 text-base text-cohort-ink-90 outline-none focus:border-cohort-primary';

const CHECK_ROW =
  'flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm leading-relaxed text-cohort-ink-70';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [consentPipa, setConsentPipa] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 0 && consentPipa && state !== 'submitting';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setState('submitting');
    setErrorMsg(null);

    let distinctId: string | undefined;
    try {
      distinctId = posthog.get_distinct_id();
    } catch {
      distinctId = undefined;
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          consent_pipa: consentPipa,
          consent_marketing: consentMarketing,
          ab_variant: getAbVariant(),
          distinct_id: distinctId,
        }),
      });
      const data = await res.json();

      if (res.ok && data.message === 'subscribed') {
        setState('subscribed');
      } else if (res.ok && data.message === 'already_subscribed') {
        setState('already');
      } else if (res.status === 400) {
        setState('error');
        setErrorMsg('이메일 형식을 다시 확인해주세요. user@example.com 같은 형태로.');
      } else {
        setState('error');
        setErrorMsg('잠시 후 다시 시도해주세요.');
      }
    } catch {
      setState('error');
      setErrorMsg('연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
    }
  }

  // --- Success: subscribed --------------------------------------------------
  if (state === 'subscribed') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center break-keep bg-cohort-ivory px-6 py-16">
        <div className="flex items-center gap-2">
          <MascotAvatar character="aurora" state="happy" size={44} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-cohort-ink-90">
          사전 신청 완료
        </h1>
        <p className="mt-3 text-base leading-relaxed text-cohort-ink-70">
          Aurora 🕊가 launch 소식을 가장 먼저 전해드릴게요. 확인 이메일을
          보냈으니 받은편지함을 확인해주세요.
        </p>
        <Link
          href="/"
          className="mt-8 text-sm font-semibold text-cohort-primary"
        >
          홈으로 돌아가기
        </Link>
      </main>
    );
  }

  // --- Already subscribed (gentle, not an error) ----------------------------
  if (state === 'already') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center break-keep bg-cohort-ivory px-6 py-16">
        <h1 className="text-2xl font-bold text-cohort-ink-90">
          이미 신청된 이메일이에요
        </h1>
        <p className="mt-3 text-base leading-relaxed text-cohort-ink-70">
          이미 cohort 사전 신청 명단에 있어요. launch 소식, 잊지 않고
          전해드릴게요.
        </p>
        <Link
          href="/"
          className="mt-8 text-sm font-semibold text-cohort-primary"
        >
          홈으로 돌아가기
        </Link>
      </main>
    );
  }

  // --- Form -----------------------------------------------------------------
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col break-keep bg-cohort-ivory px-6 pb-28 pt-16">
      <h1 className="text-2xl font-bold text-cohort-ink-90">사전 신청</h1>
      <p className="mt-2 text-sm leading-relaxed text-cohort-ink-70">
        launch 소식을 가장 먼저 받아보세요. Aurora 🕊와 Vesper 🦅가 함께합니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="text-sm font-semibold text-cohort-ink-90"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1.5 ${INPUT_CLASS}`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={CHECK_ROW}>
            <input
              type="checkbox"
              checked={consentPipa}
              onChange={(e) => setConsentPipa(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-cohort-primary"
            />
            <span>
              <strong>(필수)</strong> 개인정보 수집·이용 동의 — 수집 항목:
              이메일 · 목적: 사전 신청자 안내 + launch notification · 보유: 90일
              (또는 설정 페이지에서 즉시 삭제 요청 시).
            </span>
          </label>
          <label className={CHECK_ROW}>
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-cohort-primary"
            />
            <span>
              <strong>(선택)</strong> 마케팅 메시지 수신 — launch 후 신규
              기능·이벤트 안내.
            </span>
          </label>
        </div>

        {errorMsg && (
          <p
            role="alert"
            className="flex items-start gap-1.5 text-sm text-cohort-warning"
          >
            <span aria-hidden="true">ⓘ</span>
            <span>{errorMsg}</span>
          </p>
        )}

        {/* Bottom-fixed submit */}
        <div className="fixed inset-x-0 bottom-0 border-t border-cohort-ink-10 bg-cohort-ivory/95 px-6 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-md flex-col gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="min-h-[52px] w-full rounded-lg bg-cohort-primary px-5 text-base font-semibold text-cohort-ivory transition-colors duration-fast ease-out disabled:opacity-50"
            >
              {state === 'submitting' ? '신청 중…' : '사전 신청하기'}
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] items-center justify-center text-sm font-medium text-cohort-ink-50"
            >
              취소
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
