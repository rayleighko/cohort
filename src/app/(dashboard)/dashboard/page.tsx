import { Suspense } from 'react';
import Card from '@/components/ui/Card';
import AuroraNarrationCard from '@/components/aurora/AuroraNarrationCard';
import MascotChatBubble from '@/components/aurora/MascotChatBubble';
import IndicatorCard from '@/components/shape-a/IndicatorCard';
import { getMacroSnapshot } from '@/lib/macro/snapshot';
import type { MacroComposite, MacroZone } from '@/lib/macro/composite';

// Strategic Decision 0 Option B: zone label uses neutral monetary register
// only. No allocation, timing, or buy/sell copy anywhere on this surface.
export const revalidate = 3600;

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

// State-color rule: border-tier only (success/warning never on body text).
const ZONE_ACCENT: Record<MacroZone, string> = {
  dovish: 'border-l-cohort-success',
  'neutral-dovish': 'border-l-cohort-success',
  neutral: 'border-l-cohort-ink-30',
  'neutral-hawkish': 'border-l-cohort-warning',
  hawkish: 'border-l-cohort-danger',
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
    <div
      className={`inline-flex items-center gap-2 rounded-full border-l-4 bg-white px-4 py-2 shadow-sm ${ZONE_ACCENT[zone]}`}
    >
      <span className="font-medium text-cohort-ink-90">
        {ZONE_LABEL_KO[zone]}
      </span>
      <span className="font-mono text-sm text-cohort-ink-70">({zone})</span>
    </div>
  );
}

function CompositeCard({ composite }: { composite: MacroComposite }) {
  return (
    <Card className={`border-l-4 ${ZONE_ACCENT[composite.zone]}`}>
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

async function MacroBody() {
  try {
    const { composite, fetchedAt } = await getMacroSnapshot();
    return (
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <p className="font-mono text-sm text-cohort-ink-70">
            기준일 {formatAsOf(composite.asOfDate)} · 갱신{' '}
            {formatKst(fetchedAt)} KST
          </p>
          <h1 className="break-keep text-2xl font-medium text-cohort-ink-90 sm:text-3xl">
            오늘의 cohort.
          </h1>
        </header>
        <CompositeCard composite={composite} />
        <AuroraNarrationCard composite={composite} />
        <KeyDriverCard composite={composite} />
        <IndicatorGrid composite={composite} />
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
      {/* Always-accessible Aurora chat per 14-arch §14.3 + 26-spec line 520. */}
      <MascotChatBubble />
    </main>
  );
}
