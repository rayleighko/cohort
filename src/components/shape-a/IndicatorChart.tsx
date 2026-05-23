'use client';

/**
 * IndicatorChart — 30-day standalone history chart for a single indicator.
 *
 * Day 8 scope: scaffold only. Renders a header + an empty-state placeholder.
 * W3 full wire-up will add: axes, hover tooltip, range selector (7/30/90/1y),
 * deltas vs comparable historical windows. For now this exists so that the
 * `/dashboard/shape-a/[indicator]` detail page (W3) has a stable import.
 *
 * Strategic Decision 0 Option B applies: this surface displays values and
 * dates only — no allocation / timing / advisory copy.
 */
import Card from '@/components/ui/Card';
import type { MacroIndicator } from '@/lib/macro/composite';

interface Props {
  indicator: MacroIndicator;
}

const INDICATOR_LABEL_KO: Record<string, string> = {
  KR_US_RATE_SPREAD: '한미 금리차',
  USDKRW: '원/달러 환율',
  VIXCLS: 'VIX 변동성 지수',
  DTWEXBGS: '달러 지수 (DXY)',
  KR_10Y: '한국 국고채 10년',
  DGS10: '미국 국채 10년',
};

export default function IndicatorChart({ indicator }: Props) {
  const label = INDICATOR_LABEL_KO[indicator.code] ?? indicator.code;
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-cohort-ink-70">
          {label} — 30일 추이
        </p>
        <div
          aria-hidden="true"
          className="flex h-40 w-full items-center justify-center rounded-sm bg-cohort-ink-05"
        >
          <p className="break-keep text-sm text-cohort-ink-50">
            30일 추이 차트는 곧 제공됩니다.
          </p>
        </div>
      </div>
    </Card>
  );
}
