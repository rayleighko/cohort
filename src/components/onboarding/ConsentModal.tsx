'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/client';
import MascotAvatar from '@/components/mascot/MascotAvatar';

/**
 * PIPA onboarding consent — Modal 1 (Welcome + Consent).
 *
 * Per 20-sim-real-verification §11.1/§11.8 + 38-brief §5.4. Mobile-first:
 * single column, vertical stack, 44px+ touch targets.
 *
 * 3 required consents (gate the "다음" button) + 2 optional.
 * Persisted columns (25-spec §4 — consents live on `user_profile`):
 *   - consent_analytics          ← 개인정보 수집·이용 동의 (required)
 *   - consent_interview          ← 인터뷰 초대 수신 (optional)
 *   - consent_kakao_notification ← 마케팅·알림 메시지 수신 (optional)
 * 만 14세 확인 + 자본시장법 인지 are acknowledgement gates (no column;
 * stored-consent expansion deferred to W4 full survey).
 *
 * Full onboarding survey follows consent in OnboardingFlow — default redirect
 * to /shape-a when `onConsentComplete` is not provided.
 */
interface ConsentModalProps {
  userId: string;
  /** When set, runs after consent is saved instead of redirecting to /shape-a. */
  onConsentComplete?: () => void;
}

const CHECK_ROW =
  'flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm leading-relaxed text-cohort-charcoal';

const CHECKBOX_CLASS =
  'mt-0.5 h-5 w-5 min-h-[20px] min-w-[20px] flex-shrink-0 accent-cohort-primary';

export default function ConsentModal({ userId, onConsentComplete }: ConsentModalProps) {
  const router = useRouter();

  // Required
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeNotAdvisory, setAgreeNotAdvisory] = useState(false);
  // Optional
  const [agreeInterview, setAgreeInterview] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed = agreePrivacy && agreeAge && agreeNotAdvisory;

  async function handleNext() {
    if (!canProceed) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: upsertError } = await supabase
      .from('user_profile')
      .upsert(
        {
          id: userId,
          consent_analytics: agreePrivacy,
          consent_interview: agreeInterview,
          consent_kakao_notification: agreeMarketing,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (upsertError) {
      // supabase-js wraps PostgREST errors in a returned object instead of
      // throwing, so without explicit logging this fails silently in Sentry.
      // Surface code/details to console + Sentry + the visible error string
      // so the operator can diagnose RLS/network/PIPA storage failures.
      console.error('[onboarding] consent upsert failed', {
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        userId,
      });
      Sentry.captureException(upsertError, {
        tags: { surface: 'onboarding_consent' },
        extra: {
          userId,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint,
        },
      });
      const codeSuffix = upsertError.code ? ` (${upsertError.code})` : '';
      setError(
        `동의 저장에 실패했습니다${codeSuffix}. 새로고침 후 다시 시도하거나 운영자에게 문의해주세요.`,
      );
      setSubmitting(false);
      return;
    }

    if (onConsentComplete) {
      onConsentComplete();
      setSubmitting(false);
      return;
    }

    router.push('/shape-a');
    router.refresh();
  }

  async function handleCancel() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      {/* Welcome */}
      <div className="flex items-center gap-2">
        <MascotAvatar character="aurora" state="calm" size={40} />
        <MascotAvatar character="vesper" state="calm" size={40} />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-cohort-charcoal">
        시작하기 전에 잠시만요
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-cohort-charcoal/70">
        Cohort에 오신 것을 환영합니다. 본 서비스는 sophisticated retail의 투자
        페이스 메이트입니다.
      </p>
      <ul className="mt-3 flex flex-col gap-1 text-sm leading-relaxed text-cohort-charcoal/70">
        <li>· Aurora 🕊가 매일 macro를 정리합니다.</li>
        <li>· Vesper 🦅가 본인 trigger 신호를 정리합니다.</li>
        <li>
          · 본인 plan에 대한 <strong>추천·권장은 하지 않습니다</strong> (정보{/* OPTION-B-ALLOWED: 부정형 고지 */}
          제공 + 의사결정 지원 도구).
        </li>
      </ul>

      {/* Privacy short-form */}
      <div className="mt-5 rounded-xl bg-white p-4 text-xs leading-relaxed text-cohort-charcoal/65">
        <p className="font-semibold text-cohort-charcoal/80">
          개인정보 처리 안내 (요약)
        </p>
        <p className="mt-1">
          수집: 이메일, 익명 ID, 투자 경험·사용 행동 데이터 · 목적: 서비스
          개인화·개선 · 보유: raw 90일, 이후 익명 집계만 · 제3자 제공: 없음
          (Supabase 위탁 처리만) · 권리: 설정 &gt; 데이터 관리에서 즉시 삭제
          요청 가능.
        </p>
        <Link
          href="/guide/privacy"
          className="mt-2 inline-block font-semibold text-cohort-primary"
        >
          전체 개인정보 처리방침 보기
        </Link>
      </div>

      {/* Consents */}
      <div className="mt-5 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-cohort-charcoal/45">
          필수 동의
        </p>
        <label className={CHECK_ROW}>
          <input
            type="checkbox"
            checked={agreePrivacy}
            onChange={(e) => setAgreePrivacy(e.target.checked)}
            className={CHECKBOX_CLASS}
          />
          <span>
            <strong>(필수)</strong> 개인정보 처리방침을 확인했고, 개인정보
            수집·이용 및 익명 분석에 동의합니다.
          </span>
        </label>
        <label className={CHECK_ROW}>
          <input
            type="checkbox"
            checked={agreeAge}
            onChange={(e) => setAgreeAge(e.target.checked)}
            className={CHECKBOX_CLASS}
          />
          <span>
            <strong>(필수)</strong> 만 14세 이상입니다.
          </span>
        </label>
        <label className={CHECK_ROW}>
          <input
            type="checkbox"
            checked={agreeNotAdvisory}
            onChange={(e) => setAgreeNotAdvisory(e.target.checked)}
            className={CHECKBOX_CLASS}
          />
          <span>
            <strong>(필수)</strong> 본 서비스가 자본시장법상 정보 제공·의사결정
            지원 도구이며, 투자자문업 서비스가 아님을 이해합니다.
          </span>
        </label>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cohort-charcoal/45">
          선택 동의
        </p>
        <label className={CHECK_ROW}>
          <input
            type="checkbox"
            checked={agreeInterview}
            onChange={(e) => setAgreeInterview(e.target.checked)}
            className={CHECKBOX_CLASS}
          />
          <span>
            <strong>(선택)</strong> 서비스 개선을 위한 1:1 인터뷰(30-60분) 초대
            수신에 동의합니다.
          </span>
        </label>
        <label className={CHECK_ROW}>
          <input
            type="checkbox"
            checked={agreeMarketing}
            onChange={(e) => setAgreeMarketing(e.target.checked)}
            className={CHECKBOX_CLASS}
          />
          <span>
            <strong>(선택)</strong> 신규 기능·이벤트 등 마케팅·알림 메시지 수신에
            동의합니다.
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-cohort-primary">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || submitting}
          className="min-h-[48px] w-full rounded-xl bg-cohort-primary px-5 text-base font-semibold text-cohort-ivory disabled:opacity-50"
        >
          {submitting ? '저장 중…' : '다음'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="min-h-[44px] w-full rounded-xl border border-cohort-charcoal/15 px-5 text-sm font-medium text-cohort-charcoal/70 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </main>
  );
}
