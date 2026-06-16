/**
 * Macro series display formatters — Option B: values + dates only.
 */

const KST = 'Asia/Seoul';

export function formatObservationDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: KST,
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

/** X-axis tick — short date for chart legibility on mobile. */
export function formatChartAxisDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: KST,
      month: 'numeric',
      day: 'numeric',
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

/** Tooltip / detail — includes weekday for disambiguation. */
export function formatChartTooltipDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: KST,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

export function formatIndicatorValue(value: number, code: string): string {
  if (code === 'USDKRW') {
    return value.toLocaleString('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (Math.abs(value) >= 100) return value.toFixed(0);
  return value.toFixed(2);
}

export function formatYAxisTick(value: number, code: string, unit: string): string {
  const core = formatIndicatorValue(value, code);
  if (!unit || code === 'USDKRW') return core;
  return `${core}${unit === '%' || unit === '%p' ? unit : ''}`;
}

export function formatDelta(delta: number | null, unit: string): string | null {
  if (delta === null) return null;
  if (delta === 0) return `0${unit ? ` ${unit}` : ''}`;
  const sign = delta > 0 ? '+' : '−';
  const abs = Math.abs(delta);
  const formatted = abs >= 100 ? abs.toFixed(0) : abs.toFixed(2);
  return `${sign}${formatted}${unit ? ` ${unit}` : ''}`;
}
