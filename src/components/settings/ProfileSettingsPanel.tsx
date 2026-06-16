'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import SurveyModal from '@/components/onboarding/SurveyModal';
import Button from '@/components/ui/Button';

/**
 * Settings — re-run unified profile survey (Q0 + GL-RTS + factual).
 * Replaces post-survey "graceful exit" channel recommendations.
 */
export function ProfileSettingsPanel() {
  const router = useRouter();
  const [surveyOpen, setSurveyOpen] = useState(false);

  return (
    <>
      <div className="space-y-3 rounded-2xl bg-white p-5">
        <p className="break-keep text-xs leading-relaxed text-cohort-charcoal/55">
          투자 단계나 계획에 변화가 있거나, 서비스가 맞지 않다고 느껴지시면
          프로필을 다시 설정할 수 있습니다.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setSurveyOpen(true)}
        >
          투자 프로필 다시 설정
        </Button>
        <Link
          href="/settings/ips"
          className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-cohort-primary px-5 text-base font-semibold text-cohort-primary"
        >
          투자 원칙 (IPS) 작성
        </Link>
        <p className="break-keep text-[11px] leading-relaxed text-cohort-charcoal/45">
          평온할 때 본인 plan을 문서로 정리해 두는 단계예요. 코호트는 매수·매도나
          비중을 제안하지 않고, 본인이 쓴 원칙만 정리합니다.
        </p>
      </div>
      <SurveyModal
        open={surveyOpen}
        entrySurface="settings_retest"
        onClose={() => setSurveyOpen(false)}
        onComplete={() => {
          setSurveyOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
