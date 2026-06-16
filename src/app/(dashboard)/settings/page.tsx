import Link from 'next/link';
import { loadTierState } from '@/lib/payment/tier-gating';
import SubscriptionPanel from '@/components/settings/SubscriptionPanel';
import { NotificationOptIn } from '@/components/notification/NotificationOptIn';
import { ProfileSettingsPanel } from '@/components/settings/ProfileSettingsPanel';
import SignOutButton from '@/components/auth/SignOutButton';
import DeleteAccountButton from '@/components/account/DeleteAccountButton';

/**
 * Settings — subscription + 알림 + 계정 + 법적 고지 + 데이터 관리.
 * Server component: resolves tier state, renders the subscription panel.
 * 데이터 관리 = PIPA 제36조 본인 데이터 즉시 삭제 (launch blocker).
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; ips?: string }>;
}) {
  const tier = await loadTierState();
  const resolvedSearchParams = await searchParams;
  const checkoutSuccess = resolvedSearchParams.checkout === 'success';
  const ipsSaved = resolvedSearchParams.ips === 'saved';

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold text-cohort-charcoal">설정</h1>

      {checkoutSuccess && (
        <p className="mt-4 rounded-xl bg-cohort-primary/10 px-4 py-3 text-sm text-cohort-primary break-keep">
          후원해 주셔서 고마워요. 코호트를 이어 가는 데 큰 힘이 됩니다.
        </p>
      )}

      {ipsSaved && (
        <p className="mt-4 rounded-xl bg-cohort-primary/10 px-4 py-3 text-sm text-cohort-primary break-keep">
          투자 원칙(IPS)을 이 기기에 저장했어요. 서버 동기화는 다음 업데이트에서
          연결됩니다.
        </p>
      )}

      {/* Voluntary support — features stay public */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        프로젝트 지원
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

      {/* 투자 프로필 — 재설정 (graceful exit 대체) */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        투자 프로필
      </h2>
      <div className="mt-2">
        <ProfileSettingsPanel />
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
          <p>개인 운영 서비스</p>
          <p>문의 gmj1197@gmail.com</p>
        </div>
      </div>

      {/* PIPA 제36조 — 본인 데이터 즉시 삭제 */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-cohort-charcoal/45">
        데이터 관리
      </h2>
      <div className="mt-2 rounded-2xl bg-white p-5 space-y-3">
        <p className="text-xs leading-relaxed text-cohort-charcoal/55 break-keep">
          개인정보보호법 제36조에 따라 본인 데이터의 즉시 삭제를 요청할 수
          있습니다. 삭제 후에는 복구할 수 없으며, 가입 정보·온보딩·페이스·
          체크포인트가 모두 영구 삭제됩니다.
        </p>
        <DeleteAccountButton />
      </div>
    </main>
  );
}
