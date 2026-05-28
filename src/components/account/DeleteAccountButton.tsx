'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

/**
 * PIPA 제36조 본인 데이터 즉시 삭제 button + 2-step confirmation.
 * Strategic Decision 0 Option B: 권유 표현 X, 사실 표시 + 위험 안내만.
 */
export default function DeleteAccountButton() {
  const router = useRouter();
  const [stage, setStage] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setStage('deleting');
    setError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const code = body.code ?? body.error ?? res.status;
        Sentry.captureMessage('PIPA delete failed', {
          level: 'error',
          extra: { code },
        });
        setError(`삭제에 실패했습니다 (${code}). 운영자에게 문의해주세요.`);
        setStage('confirm');
        return;
      }
      router.push('/?deleted=1');
      router.refresh();
    } catch (e) {
      Sentry.captureException(e, { tags: { surface: 'pipa_delete_ui' } });
      setError('연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요.');
      setStage('confirm');
    }
  }

  if (stage === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStage('confirm')}
        className="min-h-[44px] w-full rounded-xl border border-cohort-primary/30 px-5 text-sm font-medium text-cohort-primary"
      >
        본인 데이터 즉시 삭제
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-cohort-primary/5 p-4 text-xs leading-relaxed text-cohort-charcoal/80 break-keep">
        <p className="font-semibold text-cohort-primary">
          삭제하면 되돌릴 수 없습니다.
        </p>
        <p className="mt-1">
          계정·온보딩·페이스·체크포인트·알림 설정 모두 즉시 영구 삭제됩니다.
          익명 집계 분석은 PIPA 시행령에 따라 보유될 수 있어요.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-cohort-primary">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={stage === 'deleting'}
          className="min-h-[44px] w-full rounded-xl bg-cohort-primary px-5 text-sm font-semibold text-cohort-ivory disabled:opacity-50"
        >
          {stage === 'deleting' ? '삭제 중…' : '영구 삭제'}
        </button>
        <button
          type="button"
          onClick={() => {
            setStage('idle');
            setError(null);
          }}
          disabled={stage === 'deleting'}
          className="min-h-[44px] w-full rounded-xl border border-cohort-charcoal/15 px-5 text-sm text-cohort-charcoal/70 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </div>
  );
}
