'use client';

/**
 * IndicatorCard — single macro indicator surface card (W2 Day 3 / Day 8).
 *
 * Displays Korean label, latest + prior-day values, 7-day delta, a 30-day
 * chart with X/Y axes + tooltip, and contribution badge.
 *
 * Strategic Decision 0 Option B: values + dates only — no advisory copy.
 */
import { useMemo } from 'react';
import useSWR from 'swr';
import Card from '@/components/ui/Card';
import IndicatorSeriesChart from '@/components/shape-a/IndicatorSeriesChart';
import { SPARKLINE_STROKE } from '@/components/shape-a/chart-tokens';
import {
  formatDelta,
  formatIndicatorValue,
  formatObservationDate,
} from '@/components/shape-a/series-format';
import type { MacroIndicator } from '@/lib/macro/composite';

interface Props {
  indicator: MacroIndicator;
}

export interface SeriesResponse {
  code: string;
  source: 'ecos' | 'fred';
  observations: Array<{ date: string; value: number }>;
  latest: number | null;
  latest_date: string | null;
  delta_reference_date: string | null;
  delta_7d: number | null;
  previous_date: string | null;
  previous_value: number | null;
  delta_1d: number | null;
  range_days: number;
}

const SERIES_REFRESH_MS = 5 * 60 * 1000;

export const INDICATOR_LABEL_KO: Record<string, string> = {
  KR_US_RATE_SPREAD: '한미 금리차',
  USDKRW: '원/달러 환율',
  VIXCLS: 'VIX 변동성 지수',
  DTWEXBGS: '달러 지수 (DXY)',
  KR_10Y: '한국 국고채 10년',
  DGS10: '미국 국채 10년',
};

export const INDICATOR_UNIT: Record<string, string> = {
  KR_US_RATE_SPREAD: '%p',
  USDKRW: '원',
  VIXCLS: '',
  DTWEXBGS: '',
  KR_10Y: '%',
  DGS10: '%',
};

export const SERIES_FETCHABLE = new Set([
  'KR_10Y',
  'USDKRW',
  'DGS10',
  'VIXCLS',
  'DTWEXBGS',
]);

export { SPARKLINE_STROKE };

async function fetchSeries(code: string, days = 30): Promise<SeriesResponse> {
  const res = await fetch(
    `/api/macro/series/${encodeURIComponent(code)}?days=${days}`,
  );
  if (!res.ok) {
    throw new Error(`series_http_${res.status}`);
  }
  return (await res.json()) as SeriesResponse;
}

export { formatObservationDate, formatDelta };

export function contributionChip(contribution: number): string {
  if (contribution >= 0.5)
    return 'bg-cohort-success/10 text-cohort-success';
  if (contribution <= -0.5)
    return 'bg-cohort-danger/10 text-cohort-danger';
  return 'bg-cohort-ink-05 text-cohort-ink-70';
}

function ChartSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-48 w-full min-w-0 rounded-sm bg-cohort-ink-05 motion-safe:animate-pulse"
    />
  );
}

function ChartUnavailable() {
  return (
    <div
      className="flex h-48 w-full min-w-0 items-center justify-center rounded-sm bg-cohort-ink-05"
      role="status"
    >
      <p className="break-keep px-2 text-center text-xs text-cohort-ink-50">
        시계열을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.
      </p>
    </div>
  );
}

export default function IndicatorCard({ indicator }: Props) {
  const { code, latest, weight, contribution, source, observationDate } =
    indicator;
  const label = INDICATOR_LABEL_KO[code] ?? code;
  const unit = INDICATOR_UNIT[code] ?? '';

  const swrKey = SERIES_FETCHABLE.has(code)
    ? (['/api/macro/series', code, 30] as const)
    : null;
  const { data, error, isLoading } = useSWR<SeriesResponse, Error>(
    swrKey,
    () => fetchSeries(code, 30),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: SERIES_REFRESH_MS,
      shouldRetryOnError: false,
    },
  );

  const delta7Text = useMemo(
    () => (data ? formatDelta(data.delta_7d, unit) : null),
    [data, unit],
  );
  const delta1Text = useMemo(
    () => (data ? formatDelta(data.delta_1d, unit) : null),
    [data, unit],
  );

  const displayLatest = data?.latest ?? latest;
  const displayDate = data?.latest_date ?? observationDate ?? null;
  const compareDate7 = data?.delta_reference_date ?? null;
  const previousDate = data?.previous_date ?? null;
  const previousValue = data?.previous_value ?? null;

  const chipClass = contributionChip(contribution);

  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="break-keep font-medium text-cohort-ink-90">
            {label}
          </span>
          <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-cohort-ink-50">
            {source}
          </span>
        </div>

        {displayDate ? (
          <p className="break-keep font-mono text-xs text-cohort-ink-50">
            최신 관측 {formatObservationDate(displayDate)} (KST 일별)
            {compareDate7 && delta7Text
              ? ` · 7일 전(${formatObservationDate(compareDate7)}) 대비 ${delta7Text}`
              : null}
          </p>
        ) : null}

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-2xl font-medium text-cohort-ink-90">
            {formatIndicatorValue(displayLatest, code)}
          </span>
          {unit ? (
            <span className="font-mono text-sm text-cohort-ink-70">{unit}</span>
          ) : null}
        </div>

        {previousDate && previousValue !== null ? (
          <p className="break-keep font-mono text-xs text-cohort-ink-70">
            직전 관측 {formatObservationDate(previousDate)}{' '}
            {formatIndicatorValue(previousValue, code)}
            {unit ? ` ${unit}` : ''}
            {delta1Text ? ` · 전일 대비 ${delta1Text}` : ''}
          </p>
        ) : (
          <p className="break-keep text-xs text-cohort-ink-50">
            ECOS·FRED 일별 종가 기준 — 실시간 호가가 아니에요. 주말·공휴일은
            직전 영업일 관측치가 표시됩니다.
          </p>
        )}

        {swrKey === null ? null : isLoading ? (
          <ChartSkeleton />
        ) : error || !data ? (
          <ChartUnavailable />
        ) : (
          <IndicatorSeriesChart
            observations={data.observations}
            code={code}
            unit={unit}
            height={192}
          />
        )}

        <div className="flex items-baseline justify-between gap-3 font-mono text-xs text-cohort-ink-70">
          <span>가중 {(weight * 100).toFixed(0)}%</span>
          <span
            className={`inline-flex items-baseline rounded-sm px-1.5 py-0.5 text-sm ${chipClass}`}
          >
            기여 {contribution >= 0 ? '+' : ''}
            {contribution.toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}
