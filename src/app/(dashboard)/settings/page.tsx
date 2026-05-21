import { loadTierState } from '@/lib/payment/tier-gating';
import SubscriptionPanel from '@/components/settings/SubscriptionPanel';

/**
 * Settings — subscription + account + PIPA + 데이터 관리.
 * Server component: resolves tier state, renders the subscription panel.
 * Account / consent management / 즉시 삭제 are W5 scaffolds.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const tier = await loadTierState();
  const checkoutSuccess = searchParams.checkout === 'success';

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold text-cohort-charcoal">설정</h1>

      {checkoutSuccess && (
        <p className="mt-4 rounded-xl bg-cohort-primary/10 px-4 py-3 text-sm text-cohort-primary">
          구독이 시작되었어요. Aurora 🕊와 Vesper 🦅가 함께합니다.
        </p>
      )}

      {/* Subscription */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        구독
      </h2>
      <div className="mt-2">
        <SubscriptionPanel
          effectiveTier={tier.effective}
          rawTier={tier.rawTier}
          renewalAt={tier.subscriptionRenewalAt}
        />
      </div>

      {/* Account — W5 scaffold */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        계정
      </h2>
      <div className="mt-2 rounded-2xl bg-white p-5 text-sm text-cohort-charcoal/60">
        TODO(W5): 이메일 변경 · 비밀번호 변경 · 로그아웃.
      </div>

      {/* PIPA / data — W5 scaffold; 즉시 삭제 must land here */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        데이터 관리
      </h2>
      <div className="mt-2 rounded-2xl bg-white p-5 text-sm text-cohort-charcoal/60">
        TODO(W5): PIPA 동의 관리 · 본인 데이터 즉시 삭제 (제36조).
      </div>
    </main>
  );
}
