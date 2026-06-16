'use client';

/**
 * Macro indicator time-series chart — axes, grid, tooltip (Option B safe).
 * Uses measured container size instead of ResponsiveContainer (-1 warning fix).
 */
import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_PRIMARY,
  CHART_STROKE,
} from '@/components/shape-a/chart-tokens';
import {
  formatChartAxisDate,
  formatChartTooltipDate,
  formatIndicatorValue,
  formatYAxisTick,
} from '@/components/shape-a/series-format';
import { useChartContainerSize } from '@/components/shape-a/use-chart-container-size';

export interface ChartObservation {
  date: string;
  value: number;
}

interface Props {
  observations: ChartObservation[];
  code: string;
  unit: string;
  /** Fixed chart area height in px (mobile-first). */
  height?: number;
  className?: string;
}

interface TooltipPayload {
  payload?: ChartObservation;
}

function ChartTooltip({
  active,
  payload,
  code,
  unit,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  code: string;
  unit: string;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-cohort-ink-10 bg-white px-3 py-2 shadow-sm">
      <p className="break-keep font-mono text-xs text-cohort-ink-50">
        {formatChartTooltipDate(point.date)}
      </p>
      <p className="font-mono text-sm font-medium text-cohort-ink-90">
        {formatIndicatorValue(point.value, code)}
        {unit && code !== 'USDKRW' ? (
          <span className="text-cohort-ink-70"> {unit}</span>
        ) : unit === '원' ? (
          <span className="text-cohort-ink-70"> {unit}</span>
        ) : null}
      </p>
    </div>
  );
}

function computeYDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = span > 0 ? span * 0.1 : Math.abs(max) * 0.02 || 1;
  return [min - pad, max + pad];
}

export default function IndicatorSeriesChart({
  observations,
  code,
  unit,
  height = 192,
  className = '',
}: Props) {
  const { ref, size, ready } = useChartContainerSize(height);

  const chartData = useMemo(
    () =>
      [...observations].sort((a, b) => a.date.localeCompare(b.date)),
    [observations],
  );

  const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const yDomain = useMemo(
    () => computeYDomain(chartData.map((d) => d.value)),
    [chartData],
  );

  if (chartData.length < 2) {
    return (
      <div
        className={`flex items-center justify-center rounded-sm bg-cohort-ink-05 ${className}`}
        style={{ height }}
        role="status"
      >
        <p className="break-keep px-2 text-center text-xs text-cohort-ink-50">
          추이를 그리려면 2일 이상의 관측값이 필요해요.
        </p>
      </div>
    );
  }

  const ariaLabel = `${chartData.length}일 추이, ${formatChartAxisDate(chartData[0].date)}부터 ${formatChartAxisDate(chartData[chartData.length - 1].date)}까지`;

  return (
    <div
      ref={ref}
      className={`w-full min-w-0 ${className}`}
      style={{ height }}
      role="img"
      aria-label={ariaLabel}
    >
      {!ready || !size ? (
        <div
          aria-hidden="true"
          className="h-full w-full motion-safe:animate-pulse rounded-sm bg-cohort-ink-05"
        />
      ) : (
        <LineChart
          width={size.width}
          height={size.height}
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            stroke={CHART_GRID}
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartAxisDate}
            tick={{ fill: CHART_AXIS, fontSize: 10 }}
            axisLine={{ stroke: CHART_GRID }}
            tickLine={false}
            minTickGap={20}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            tickFormatter={(v) => formatYAxisTick(Number(v), code, unit)}
            tick={{ fill: CHART_AXIS, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={code === 'USDKRW' ? 56 : 44}
          />
          <Tooltip
            content={
              <ChartTooltip code={code} unit={unit} />
            }
            cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_STROKE}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_PRIMARY, stroke: CHART_PRIMARY }}
            isAnimationActive={false}
          />
          {latest ? (
            <ReferenceDot
              x={latest.date}
              y={latest.value}
              r={4}
              fill={CHART_PRIMARY}
              stroke={CHART_PRIMARY}
              ifOverflow="extendDomain"
            />
          ) : null}
        </LineChart>
      )}
    </div>
  );
}
