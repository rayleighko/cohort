/**
 * Aurora 🕊 pace companion — full-screen surface (same engine as layout FAB).
 */
import CompanionPageClient from '@/components/companion/CompanionPageClient';

export default function ChatPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col px-4 py-6">
      <h1 className="break-keep text-xl font-semibold text-cohort-charcoal">
        Aurora 페이스 컴패니언
      </h1>
      <p className="mt-1 break-keep text-sm text-cohort-ink-50">
        매크로·plan·분할매수·trigger·IPS — 규칙 기반 안내 (API 과금 없음)
      </p>
      <div className="mt-4 flex-1">
        <CompanionPageClient />
      </div>
    </main>
  );
}
