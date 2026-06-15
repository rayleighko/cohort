'use client';

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
