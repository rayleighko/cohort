'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import ConsentModal from '@/components/onboarding/ConsentModal';
import SurveyModal from '@/components/onboarding/SurveyModal';

interface OnboardingFlowProps {
  userId: string;
}

/**
 * Onboarding gate: PIPA consent → unified survey (Q0 + GL-RTS + factual).
 * Landing (/) stays waitlist-only; signed-in users reach this via /onboarding.
 */
export default function OnboardingFlow({ userId }: OnboardingFlowProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'consent' | 'survey'>('consent');
  const [surveyOpen, setSurveyOpen] = useState(false);

  if (phase === 'consent') {
    return (
      <ConsentModal
        userId={userId}
        onConsentComplete={() => {
          setPhase('survey');
          setSurveyOpen(true);
        }}
      />
    );
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10">
        <p className="break-keep text-center text-sm text-cohort-ink-70">
          동의가 저장되었습니다. 프로필 설문을 이어서 진행해 주세요.
        </p>
      </main>
      <SurveyModal
        open={surveyOpen}
        entrySurface="onboarding_gate"
        onClose={() => {
          setSurveyOpen(false);
          router.push('/shape-a');
          router.refresh();
        }}
        onComplete={() => {
          router.push('/shape-a');
          router.refresh();
        }}
      />
    </>
  );
}
