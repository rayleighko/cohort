'use client';

/**
 * IndicatorCard — single macro indicator surface card (W2 Day 3 / Day 8).
 *
 * Props: one `MacroIndicator` from the dashboard composite. The card
 * displays the Korean label, latest value with unit, 7-day delta (sign-
 * appropriate), a Recharts sparkline of the 30-day series, and the
 * contribution badge (-10..+10 weighted) tagged with the source.
 *
 * Strategic Decision 0 Option B: never says "비중/매수/매도/timing/추천". OPTION-B-ALLOWED: 규칙 인용 주석.
 * Surfaces values + dates + neutral source labels only.
 *
 * Token discipline (AD-1): cohort/aurora tokens only — no raw hex/px
 * EXCEPT the Recharts `stroke` prop, which only accepts CSS color
 * strings (it doesn't process Tailwind classes). The literal hex used
 * matches the `cohort.ink-70` token (42 §6.2 raw value authority).
 *
 * State color rule (memory: component-time-state-color-rule): body text
 * uses cohort-ink-{50,70,90}; success/warning/danger restricted to
 * borders / large-text / icons. Sparkline stroke uses ink-70 neutral.
 *
 * Mobile-first: 360px width legible, break-keep on Korean text. Card is
 * read-only, no interactive elements (no 44px touch-target dependency).
 */
import { useMemo } from 'react';
import useSWR from 'swr';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import Card from '@/components/ui/Card';
import type { MacroIndicator } from '@/lib/macro/composite';

interface Props {
  indicator: MacroIndicator;
}

interface SeriesResponse {
  code: string;
  source: 'ecos' | 'fred';
  observations: Array<{ date: string; value: number }>;
  latest: number | null;
  latest_date: string | null;
  delta_reference_date: string | null;
  delta_7d: number | null;
}

const HOUR_MS = 3_600_000;
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

// /api/macro/series/[code] allow-list. Composite-only indicators (e.g.
// KR_US_RATE_SPREAD = us10y - kr10y) are derived, not standalone series
// — skip the sparkline for those.
export const SERIES_FETCHABLE = new Set([
  'KR_10Y',
  'USDKRW',
  'DGS10',
  'VIXCLS',
  'DTWEXBGS',
]);

// cohort.ink-70 raw hex — required by Recharts stroke prop (className not
// supported on <Line/>). Source of truth: tailwind.config.ts + 42 §6.2.
export const SPARKLINE_STROKE = '#404040';

async function fetchSeries(code: string): Promise<SeriesResponse> {
  const res = await fetch(`/api/macro/series/${encodeURIComponent(code)}`);
  if (!res.ok) {
    throw new Error(`series_http_${res.status}`);
  }
  return (await res.json()) as SeriesResponse;
}

export function formatObservationDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso + 'T12:00:00'));
  } catch {
    return iso;
  }
}

export function formatDelta(delta: number | null, unit: string): string | null {
  if (delta === null) return null;
  if (delta === 0) return `0${unit ? ` ${unit}` : ''}`;
  const sign = delta > 0 ? '+' : '−';
  const abs = Math.abs(delta);
  const formatted = abs >= 100 ? abs.toFixed(0) : abs.toFixed(2);
  return `${sign}${formatted}${unit ? ` ${unit}` : ''}`;
}

/**
 * Contribution-sign tinted chip background + text token (W3 Mon Day 1
 * polish): the previous `border-l-4` left-border accent (사장님 "카드 좌측
 * 보더" verbatim complaint) is retired. Signal is preserved through a
 * compact subtle-bg chip on the contribution figure. State-color rule
 * (42 §2.3) still honored — `bg-*-05` tints are UI elements (3:1 contrast
 * floor), body text remains cohort-ink-{50,70,90}. Threshold ±0.5 keeps
 * weak-signal indicators visually neutral.
 */
export function contributionChip(contribution: number): string {
  if (contribution >= 0.5)
    return 'bg-cohort-success/10 text-cohort-success';
  if (contribution <= -0.5)
    return 'bg-cohort-danger/10 text-cohort-danger';
  return 'bg-cohort-ink-05 text-cohort-ink-70';
}

function Sparkline({
  observations,
}: {
  observations: SeriesResponse['observations'];
}) {
  if (!observations || observations.length < 2) return null;
  return (
    <div
      className="h-10 w-full"
      role="img"
      aria-label={`30일 추이 sparkline, ${observations.length}개 관측값`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={observations}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
        >
          <Line
            type="monotone"
            dataKey="value"
            stroke={SPARKLINE_STROKE}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SparklineSkeleton() {
  // aria-hidden — the skeleton is a transient decoration; the meaningful
  // state (label + latest value + delta) is already announced by sibling
  // text. Polite live-region noise multiplied per-card on first paint.
  return (
    <div
      aria-hidden="true"
      className="h-10 w-full rounded-sm bg-cohort-ink-05 motion-safe:animate-pulse"
    />
  );
}

function SparklineUnavailable() {
  return (
    <div
      aria-hidden="true"
      className="h-10 w-full rounded-sm bg-cohort-ink-05"
    />
  );
}

export default function IndicatorCard({ indicator }: Props) {
  const { code, latest, weight, contribution, source, observationDate } =
    indicator;
  const label = INDICATOR_LABEL_KO[code] ?? code;
  const unit = INDICATOR_UNIT[code] ?? '';

  const swrKey = SERIES_FETCHABLE.has(code)
    ? (['/api/macro/series', code] as const)
    : null;
  const { data, error, isLoading } = useSWR<SeriesResponse, Error>(
    swrKey,
    () => fetchSeries(code),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: SERIES_REFRESH_MS,
      shouldRetryOnError: false,
    },
  );

  const deltaText = useMemo(
    () => (data ? formatDelta(data.delta_7d, unit) : null),
    [data, unit],
  );

  const displayDate =
    data?.latest_date ?? observationDate ?? null;
  const compareDate = data?.delta_reference_date ?? null;

  const chipClass = contributionChip(contribution);

  return (
    <Card>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="break-keep font-medium text-cohort-ink-90">
            {label}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-cohort-ink-50">
            {source}
          </span>
        </div>
        {displayDate ? (
          <p className="font-mono text-xs text-cohort-ink-50">
            관측 {formatObservationDate(displayDate)}
            {compareDate && deltaText
              ? ` · 7일 전(${formatObservationDate(compareDate)}) 대비`
              : deltaText
                ? ' · 7일 전 대비'
                : ''}
          </p>
        ) : null}
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-medium text-cohort-ink-90">
            {latest.toFixed(2)}
          </span>
          {unit ? (
            <span className="font-mono text-sm text-cohort-ink-70">{unit}</span>
          ) : null}
          {deltaText ? (
            <span className="break-keep font-mono text-sm text-cohort-ink-70">
              7일 {deltaText}
            </span>
          ) : null}
        </div>
        {swrKey === null ? null : isLoading ? (
          <SparklineSkeleton />
        ) : error || !data ? (
          <SparklineUnavailable />
        ) : (
          <Sparkline observations={data.observations} />
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
