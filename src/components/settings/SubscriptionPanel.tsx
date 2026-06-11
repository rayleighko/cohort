'use client';

import { useState } from 'react';
import MascotAvatar from '@/components/mascot/MascotAvatar';
import { POLAR_PLANS, type PaidPlan } from '@/lib/polar/plans';
import type { SubscriptionTier } from '@/types/shapes';

/**
 * Settings subscription panel.
 * - Free users see the upgrade section (#upgrade anchor — requireTier
 *   redirects here) with Aurora's companion-framed narration (Option B:
 *   no 추천/권장). OPTION-B-ALLOWED: 규칙 인용 주석.
 * - Pro/Premium users see plan status + a "구독 관리" button → Polar portal.
 */
interface SubscriptionPanelProps {
  effectiveTier: SubscriptionTier;
  rawTier: SubscriptionTier;
  renewalAt: string | null;
}

export default function SubscriptionPanel({
  effectiveTier,
  rawTier,
  renewalAt,
}: SubscriptionPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: PaidPlan) {
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error ?? 'checkout_failed');
    } catch {
      setError('결제 페이지를 여는 데 실패했어요. 잠시 후 다시 시도해주세요.');
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy('portal');
    setError(null);
    try {
      const res = await fetch('/api/portal', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error ?? 'portal_unavailable');
    } catch {
      setError('구독 관리 페이지를 여는 데 실패했어요. 잠시 후 다시 시도해주세요.');
      setBusy(null);
    }
  }

  // --- Free: upgrade section -------------------------------------------------
  if (effectiveTier === 'free') {
    return (
      <section id="upgrade" className="scroll-mt-6 rounded-2xl bg-white p-5">
        <div className="flex items-center gap-2">
          <MascotAvatar character="aurora" state="calm" size={36} />
          <p className="text-sm leading-relaxed text-cohort-charcoal/75">
            <span className="font-semibold text-cohort-primary">Aurora 🕊</span>{' '}
            — Shape A·B·C는 Pro와 함께 열려요. 본인 페이스로 천천히 결정하세요.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {(Object.keys(POLAR_PLANS) as PaidPlan[]).map((plan) => {
            const p = POLAR_PLANS[plan];
            return (
              <div
                key={plan}
                className="flex items-center justify-between rounded-xl border border-cohort-charcoal/10 p-4"
              >
                <div>
                  <p className="font-semibold text-cohort-charcoal">
                    {p.label}
                  </p>
                  <p className="text-sm text-cohort-charcoal/55">
                    ${p.priceUsd}/월
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startCheckout(plan)}
                  disabled={busy !== null}
                  className="min-h-[44px] rounded-xl bg-cohort-primary px-5 text-sm font-semibold text-cohort-ivory disabled:opacity-50"
                >
                  {busy === plan ? '여는 중…' : `${p.label} 시작`}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-cohort-primary">
            {error}
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-cohort-charcoal/45">
          결제는 Polar(Merchant of Record)를 통해 안전하게 처리됩니다. 정보 제공
          + 의사결정 지원 도구이며, 투자 추천·권장 서비스가 아닙니다.{/* OPTION-B-ALLOWED: 부정형 고지 */}
        </p>
      </section>
    );
  }

  // --- Pro / Premium: status + manage ---------------------------------------
  const planLabel = effectiveTier === 'premium' ? 'Premium' : 'Pro';
  return (
    <section id="upgrade" className="scroll-mt-6 rounded-2xl bg-white p-5">
      <p className="text-sm text-cohort-charcoal/55">현재 구독</p>
      <p className="mt-1 text-xl font-bold text-cohort-primary">{planLabel}</p>
      {rawTier === 'trial' && (
        <p className="mt-1 text-sm text-cohort-charcoal/60">
          체험 기간 — Pro 기능을 이용 중입니다.
        </p>
      )}
      {renewalAt && (
        <p className="mt-1 text-sm text-cohort-charcoal/60">
          다음 갱신: {new Date(renewalAt).toLocaleDateString('ko-KR')}
        </p>
      )}

      <button
        type="button"
        onClick={openPortal}
        disabled={busy !== null}
        className="mt-4 min-h-[44px] w-full rounded-xl border border-cohort-primary px-5 text-sm font-semibold text-cohort-primary disabled:opacity-50"
      >
        {busy === 'portal' ? '여는 중…' : '구독 관리 · 해지'}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-cohort-primary">
          {error}
        </p>
      )}
    </section>
  );
}
