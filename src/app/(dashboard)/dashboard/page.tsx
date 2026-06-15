import { Suspense } from 'react';
import Card from '@/components/ui/Card';
import { AuroraNarrationBody } from '@/components/aurora/AuroraNarrationCard';
import IndicatorCard from '@/components/shape-a/IndicatorCard';
import MascotAvatar from '@/components/mascot/MascotAvatar';
import { getMacroSnapshot } from '@/lib/macro/snapshot';
import {
  getLatestNarration,
  type LatestNarration,
} from '@/lib/aurora/get-latest-narration';
import type { MacroComposite, MacroZone } from '@/lib/macro/composite';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: '오늘의 cohort — Macro Dashboard',
  description:
    '한미 금리차 · 원/달러 · VIX · DXY 통합 매크로 컴포지트. 정보 + 의사결정 지원 도구.',
};

const ZONE_LABEL_KO: Record<MacroZone, string> = {
  dovish: '비둘기파',
  'neutral-dovish': '중립–비둘기',
  neutral: '중립',
  'neutral-hawkish': '중립–매파',
  hawkish: '매파',
};

// State-color rule: 42 §2.3 + 40 AD-1 — state tokens for border/icon only,
// never on body text. W3 Mon Day 1 polish (브리프 §4.2 specific fix #1):
// retired `border-l-4` card accent in favor of a colored-dot prefix on the
// ZoneBadge — visual signal preserved without the "AI가 만든 것 같음"
// left-border stripe the 사장님 flagged. Dot color uses the same state token,
// applied as `bg-*` on a 6px circle (UI element, contrast 3:1 floor still met).
const ZONE_DOT: Record<MacroZone, string> = {
  dovish: 'bg-cohort-success',
  'neutral-dovish': 'bg-cohort-success',
  neutral: 'bg-cohort-ink-50',
  'neutral-hawkish': 'bg-cohort-warning',
  hawkish: 'bg-cohort-danger',
};

const INDICATOR_LABEL_KO: Record<string, string> = {
  KR_US_RATE_SPREAD: '한미 금리차',
  USDKRW: '원/달러 환율',
  VIXCLS: 'VIX 변동성',
  DTWEXBGS: '달러 지수 (DXY proxy)',
};

const KST_DATETIME_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const KST_DATE_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatKst(iso: string): string {
  try {
    return KST_DATETIME_FMT.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatAsOf(date: string): string {
  try {
    return KST_DATE_FMT.format(new Date(date));
  } catch {
    return date;
  }
}

function ZoneBadge({ zone }: { zone: MacroZone }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-cohort-ink-05 px-3 py-1.5">
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${ZONE_DOT[zone]}`}
      />
      <span className="text-sm font-medium text-cohort-ink-90">
        {ZONE_LABEL_KO[zone]}
      </span>
      <span className="font-mono text-xs text-cohort-ink-50">({zone})</span>
    </div>
  );
}

function CompositeCard({ composite }: { composite: MacroComposite }) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wider text-cohort-ink-70">
          Macro composite
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-4xl font-medium text-cohort-ink-90 sm:text-5xl">
            {composite.score.toFixed(2)}
          </span>
          <span className="font-mono text-sm text-cohort-ink-50">/ ±10</span>
        </div>
        <ZoneBadge zone={composite.zone} />
        {composite.degraded ? (
          <p className="break-keep text-sm text-cohort-ink-70">
            일부 지표 fetch 실패. {composite.missingIndicators?.length ?? 0}개
            누락 상태로 컴포지트 계산.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function KeyDriverCard({ composite }: { composite: MacroComposite }) {
  const driver = composite.indicators.find(
    (i) => i.code === composite.keyDriver.code,
  );
  const label =
    INDICATOR_LABEL_KO[composite.keyDriver.code] ?? composite.keyDriver.code;
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-cohort-ink-70">
          Key driver
        </p>
        <p className="break-keep text-lg font-medium text-cohort-ink-90">
          {label}
        </p>
        <p className="font-mono text-sm text-cohort-ink-70">
          기여도 {composite.keyDriver.contribution.toFixed(2)}
          {driver
            ? ` · 정규화 ${driver.normalized.toFixed(2)} · 가중 ${(driver.weight * 100).toFixed(0)}%`
            : ''}
        </p>
      </div>
    </Card>
  );
}

function IndicatorGrid({ composite }: { composite: MacroComposite }) {
  // 26-spec line 107 (W2 Day 3): "card grid 1-column mobile, 2-column md,
  // 3-column lg". Sparkline-equipped IndicatorCards land here.
  return (
    <section
      aria-labelledby="indicators-heading"
      className="flex flex-col gap-3"
    >
      <h2
        id="indicators-heading"
        className="text-sm font-medium uppercase tracking-wider text-cohort-ink-70"
      >
        Indicators
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {composite.indicators.map((i) => (
          <IndicatorCard key={i.code} indicator={i} />
        ))}
      </div>
    </section>
  );
}

function MacroUnavailable() {
  return (
    <Card>
      <p className="break-keep text-cohort-danger">
        매크로 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해보세요.
      </p>
    </Card>
  );
}

// W3 Mon Day 2 polish (브리프 §4.2 specific fix #7): signature mascot pair
// in the header — visible Aurora + Vesper presence so the surface reads as
// *Cohort* rather than "AI-generated dashboard template". Decorative pair,
// alt-text per MascotAvatar SVG, no interaction (chat surface lives in the
// FAB at bottom-right via (dashboard)/layout.tsx).
function MascotSignature() {
  return (
    <div
      className="flex shrink-0 items-center -space-x-1.5"
      aria-label="Aurora 🕊 + Vesper 🦅 signature"
    >
      <MascotAvatar
        character="aurora"
        state="calm"
        size={28}
        className="rounded-full ring-2 ring-white"
      />
      <MascotAvatar
        character="vesper"
        state="calm"
        size={28}
        className="rounded-full ring-2 ring-white"
      />
    </div>
  );
}

// W3 Mon Day 2 polish (브리프 §4.2 specific fix #3): Aurora narration is
// demoted from top-dominant position to a bottom-of-page collapsible block.
// Indicator data leads, framework narrative supports. Native <details> for
// zero-JS accessibility + keyboard navigation; `group-open:` Tailwind
// variant (v3.4+) swaps the affordance label. Reduced-motion respected via
// MascotChatBubble's own transitions (no animation here).
function NarrationBlock({
  composite,
  initialArchive,
}: {
  composite: MacroComposite;
  initialArchive: LatestNarration | null;
}) {
  return (
    <details className="group overflow-hidden rounded-2xl bg-white shadow-sm sm:shadow" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-aurora-calm">
          <span aria-hidden="true">🕊</span> 오로라 아침 브리핑
        </span>
        <span className="font-mono text-xs text-cohort-ink-70">
          <span className="group-open:hidden">펼치기 ▾</span>
          <span className="hidden group-open:inline">접기 ▴</span>
        </span>
      </summary>
      <div className="border-t border-cohort-ink-05 bg-aurora-calm/[0.04] p-4 sm:p-6">
        <AuroraNarrationBody
          composite={composite}
          initialArchive={initialArchive}
        />
      </div>
    </details>
  );
}

async function MacroBody() {
  try {
    const { composite, fetchedAt } = await getMacroSnapshot();
    const initialArchive = await getLatestNarration(composite.asOfDate);
    return (
      <div className="flex flex-col gap-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-mono text-sm text-cohort-ink-70">
              기준일 {formatAsOf(composite.asOfDate)} · 갱신{' '}
              {formatKst(fetchedAt)} KST
            </p>
            <p className="text-xs text-cohort-ink-50 break-keep">
              매크로는 요청 시 ECOS·FRED에서 불러옵니다. 7일 변화는 KST 기준
              영업일 관측치 비교입니다.
            </p>
            <h1 className="break-keep text-2xl font-medium text-cohort-ink-90 sm:text-3xl">
              오늘의 cohort.
            </h1>
          </div>
          <MascotSignature />
        </header>
        {/* Composite (primary) + Key driver (secondary) — single row on
            ≥sm. CompositeCard takes 2/3 width to keep the score figure
            the visual anchor; KeyDriver fills the remaining 1/3. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <CompositeCard composite={composite} />
          </div>
          <KeyDriverCard composite={composite} />
        </div>
        {/* Indicators lead (브리프 §4.2: density-first, TradingView-inspired
            multi-indicator at-a-glance). */}
        <IndicatorGrid composite={composite} />
        {/* Aurora narration demoted to bottom collapsible block. */}
        <NarrationBlock composite={composite} initialArchive={initialArchive} />
      </div>
    );
  } catch {
    return <MacroUnavailable />;
  }
}

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-screen-lg flex-col gap-4 px-4 pb-8 pt-6 sm:px-6">
      <Suspense
        fallback={
          <Card>
            <p className="text-cohort-ink-70">매크로 컴포지트 계산 중…</p>
          </Card>
        }
      >
        <MacroBody />
      </Suspense>
      {/* Aurora chat bubble lives in (dashboard)/layout.tsx — single mount
          across every dashboard route, dedupes the legacy mascot/ bubble. */}
    </main>
  );
}
