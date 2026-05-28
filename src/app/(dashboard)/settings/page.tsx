import Link from 'next/link';
import { loadTierState } from '@/lib/payment/tier-gating';
import SubscriptionPanel from '@/components/settings/SubscriptionPanel';
import { NotificationOptIn } from '@/components/notification/NotificationOptIn';
import SignOutButton from '@/components/auth/SignOutButton';

/**
 * Settings — subscription + 알림 + 계정 + 법적 고지.
 * Server component: resolves tier state, renders the subscription panel.
 * 데이터 관리 (PIPA 제36조 즉시 삭제) lands in a follow-up commit.
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

      {/* Notifications — W5 Mon */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        알림
      </h2>
      <div className="mt-2">
        <NotificationOptIn />
      </div>

      {/* 계정 */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        계정
      </h2>
      <div className="mt-2 rounded-2xl bg-white p-5 space-y-3">
        <p className="text-xs text-cohort-charcoal/55 break-keep">
          이메일·비밀번호 변경은 V1.1에서 추가됩니다. 지금은 로그아웃만 사용
          가능해요.
        </p>
        <SignOutButton />
      </div>

      {/* 법적 고지 */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        법적 고지
      </h2>
      <div className="mt-2 rounded-2xl bg-white p-5 space-y-3">
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/privacy"
              className="inline-flex min-h-[44px] items-center text-cohort-primary"
            >
              개인정보처리방침
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="inline-flex min-h-[44px] items-center text-cohort-primary"
            >
              이용약관
            </Link>
          </li>
        </ul>

        <div className="border-t border-cohort-charcoal/10 pt-3 text-xs leading-relaxed text-cohort-charcoal/55 break-keep">
          <p>
            상호명{' '}
            <strong className="font-medium text-cohort-charcoal/80">
              플랜사이
            </strong>
            {' · '}대표{' '}
            <strong className="font-medium text-cohort-charcoal/80">
              조윤환
            </strong>
          </p>
          <p>
            사업자등록번호 157-04-02001 · 통신판매업신고 2022-영등포-0450
          </p>
          <p>문의 contact@cohort.co.kr</p>
        </div>
      </div>

      {/* 데이터 관리 — W5 Thu ST3 follow-up commit */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        데이터 관리
      </h2>
      <div className="mt-2 rounded-2xl bg-white p-5 text-sm text-cohort-charcoal/60">
        TODO(W5): PIPA 동의 관리 · 본인 데이터 즉시 삭제 (제36조).
      </div>
    </main>
  );
}
