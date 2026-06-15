'use client';

import { useState } from 'react';
import MascotAvatar from '@/components/mascot/MascotAvatar';
import { POLAR_PLANS, type PaidPlan } from '@/lib/polar/plans';
import type { SubscriptionTier } from '@/types/shapes';

/**
 * Settings support panel — voluntary contribution framing.
 * All product features remain public; paid tiers are support-only in V1.
 */
interface SubscriptionPanelProps {
  effectiveTier: SubscriptionTier;
  rawTier: SubscriptionTier;
  renewalAt: string | null;
}

function isPaidSupporter(rawTier: SubscriptionTier): boolean {
  return rawTier === 'pro' || rawTier === 'premium';
}

export default function SubscriptionPanel({
  effectiveTier,
  rawTier,
  renewalAt,
}: SubscriptionPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supporter = isPaidSupporter(rawTier);
  const supporterLabel =
    rawTier === 'premium' ? POLAR_PLANS.premium.label : POLAR_PLANS.pro.label;

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
      setError('후원 관리 페이지를 여는 데 실패했어요. 잠시 후 다시 시도해주세요.');
      setBusy(null);
    }
  }

  return (
    <section id="support" className="scroll-mt-6 rounded-2xl bg-white p-5">
      <div className="flex items-start gap-2">
        <MascotAvatar character="aurora" state="calm" size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-cohort-charcoal/75 break-keep">
            <span className="font-semibold text-cohort-primary">Aurora 🕊</span>{' '}
            — 코호트는 개인 학습·사이드 프로젝트예요. 매크로·페이스·행동 가드
            도구는 모두 무료로 열려 있어요. 마음에 드셨다면 아래 후원으로
            운영을 도와주실 수 있어요.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-cohort-charcoal/50 break-keep">
            프로와 프리미엄은 기능 차등 없이 금액만 달라요. 후원은 언제든
            취소할 수 있어요.
          </p>
        </div>
      </div>

      {supporter && (
        <div className="mt-4 rounded-xl border border-cohort-primary/20 bg-cohort-primary/5 px-4 py-3">
          <p className="text-sm text-cohort-charcoal/55">지원해 주셔서 고마워요</p>
          <p className="mt-1 text-lg font-bold text-cohort-primary">
            {supporterLabel} 후원 중
          </p>
          {rawTier === 'trial' && effectiveTier === 'pro' && (
            <p className="mt-1 text-sm text-cohort-charcoal/60 break-keep">
              체험 기간이에요 — 기능은 이미 모두 이용 가능해요.
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
            className="mt-3 min-h-[44px] w-full rounded-xl border border-cohort-primary px-5 text-sm font-semibold text-cohort-primary disabled:opacity-50"
          >
            {busy === 'portal' ? '여는 중…' : '후원 관리 · 해지'}
          </button>
        </div>
      )}

      {!supporter && (
        <div className="mt-4 flex flex-col gap-3">
          {(Object.keys(POLAR_PLANS) as PaidPlan[]).map((plan) => {
            const p = POLAR_PLANS[plan];
            return (
              <div
                key={plan}
                className="rounded-xl border border-cohort-charcoal/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-cohort-charcoal">
                      {p.supportLabel}
                    </p>
                    <p className="text-xs text-cohort-charcoal/45">
                      {p.label} · ${p.priceUsd}/월
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-cohort-charcoal/60 break-keep">
                      {p.blurb}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCheckout(plan)}
                    disabled={busy !== null}
                    className="shrink-0 min-h-[44px] rounded-xl border border-cohort-charcoal/20 px-4 text-sm font-medium text-cohort-charcoal/80 disabled:opacity-50"
                  >
                    {busy === plan ? '여는 중…' : '후원하기'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-cohort-primary">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-cohort-charcoal/45 break-keep">
        결제는 Polar(Merchant of Record)를 통해 처리됩니다. 정보 제공 +
        의사결정 지원 도구이며, 투자 추천·권장 서비스가 아닙니다.{/* OPTION-B-ALLOWED: 부정형 고지 */}
      </p>
    </section>
  );
}
