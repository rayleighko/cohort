import { describe, it, expect } from 'vitest';
import { formatChartTooltipDate, formatYAxisTick } from '@/components/shape-a/series-format';

describe('formatChartTooltipDate', () => {
  it('includes weekday in Korean locale', () => {
    const out = formatChartTooltipDate('2026-06-11');
    expect(out.length).toBeGreaterThan(4);
  });
});

describe('formatYAxisTick', () => {
  it('formats USDKRW without duplicate unit suffix', () => {
    expect(formatYAxisTick(1387.5, 'USDKRW', '원')).toBe('1,387.50');
  });

  it('appends percent unit for bond yields', () => {
    expect(formatYAxisTick(3.25, 'KR_10Y', '%')).toBe('3.25%');
  });
});
