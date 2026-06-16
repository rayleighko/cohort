'use client';

/**
 * IndicatorChart — standalone history chart with range selector (7/30/90일).
 * Option B: values + dates only.
 */
import { useState } from 'react';
import useSWR from 'swr';
import Card from '@/components/ui/Card';
import IndicatorSeriesChart from '@/components/shape-a/IndicatorSeriesChart';
import {
  formatIndicatorValue,
  formatObservationDate,
} from '@/components/shape-a/series-format';
import type { MacroIndicator } from '@/lib/macro/composite';
import type { SeriesResponse } from '@/components/shape-a/IndicatorCard';
import {
  INDICATOR_LABEL_KO,
  INDICATOR_UNIT,
  SERIES_FETCHABLE,
} from '@/components/shape-a/IndicatorCard';

interface Props {
  indicator: MacroIndicator;
}

const RANGES = [7, 30, 90] as const;
type RangeDays = (typeof RANGES)[number];

async function fetchSeries(code: string, days: RangeDays): Promise<SeriesResponse> {
  const res = await fetch(
    `/api/macro/series/${encodeURIComponent(code)}?days=${days}`,
  );
  if (!res.ok) throw new Error(`series_http_${res.status}`);
  return (await res.json()) as SeriesResponse;
}

export default function IndicatorChart({ indicator }: Props) {
  const { code } = indicator;
  const label = INDICATOR_LABEL_KO[code] ?? code;
  const unit = INDICATOR_UNIT[code] ?? '';
  const [range, setRange] = useState<RangeDays>(30);

  const fetchable = SERIES_FETCHABLE.has(code);
  const { data, error, isLoading } = useSWR<SeriesResponse, Error>(
    fetchable ? (['/api/macro/series/detail', code, range] as const) : null,
    () => fetchSeries(code, range),
    { revalidateOnFocus: true, dedupingInterval: 5 * 60 * 1000 },
  );

  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="break-keep text-sm font-medium text-cohort-ink-90">
            {label} — {range}일 추이
          </p>
          <div
            className="flex gap-1 rounded-lg bg-cohort-ink-05 p-1"
            role="group"
            aria-label="조회 기간"
          >
            {RANGES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRange(d)}
                className={`min-h-[44px] min-w-[44px] rounded-md px-3 font-mono text-xs transition-colors ${
                  range === d
                    ? 'bg-white text-cohort-ink-90 shadow-sm'
                    : 'text-cohort-ink-70 hover:text-cohort-ink-90'
                }`}
                aria-pressed={range === d}
              >
                {d}일
              </button>
            ))}
          </div>
        </div>

        {data?.latest_date ? (
          <p className="font-mono text-xs text-cohort-ink-50">
            최신 {formatObservationDate(data.latest_date)} ·{' '}
            {formatIndicatorValue(data.latest ?? indicator.latest, code)}
            {unit ? ` ${unit}` : ''}
          </p>
        ) : null}

        {!fetchable ? (
          <p className="break-keep text-sm text-cohort-ink-50">
            이 지표는 파생값이라 단독 시계열이 없어요.
          </p>
        ) : isLoading ? (
          <div
            aria-hidden="true"
            className="h-56 w-full min-w-0 motion-safe:animate-pulse rounded-sm bg-cohort-ink-05"
          />
        ) : error || !data ? (
          <p className="break-keep text-sm text-cohort-ink-50" role="status">
            차트 데이터를 불러오지 못했어요.
          </p>
        ) : (
          <IndicatorSeriesChart
            observations={data.observations}
            code={code}
            unit={unit}
            height={224}
          />
        )}

        <p className="break-keep text-xs text-cohort-ink-50">
          차트는 한국은행 ECOS·FRED 일별 관측치예요. 포인트를 눌러 날짜와
          값을 확인할 수 있어요.
        </p>
      </div>
    </Card>
  );
}
