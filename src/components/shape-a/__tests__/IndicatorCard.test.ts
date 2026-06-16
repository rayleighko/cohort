import { describe, it, expect } from 'vitest';
import {
  formatChartAxisDate,
  formatDelta,
  formatIndicatorValue,
  formatObservationDate,
} from '@/components/shape-a/series-format';
import { SPARKLINE_STROKE } from '@/components/shape-a/chart-tokens';
import {
  INDICATOR_LABEL_KO,
  INDICATOR_UNIT,
  SERIES_FETCHABLE,
  contributionChip,
} from '@/components/shape-a/IndicatorCard';

describe('IndicatorCard label + unit lookups', () => {
  it('covers every composite indicator code with a Korean label', () => {
    for (const code of [
      'KR_US_RATE_SPREAD',
      'USDKRW',
      'VIXCLS',
      'DTWEXBGS',
      'KR_10Y',
      'DGS10',
    ]) {
      expect(INDICATOR_LABEL_KO[code]).toBeTruthy();
      expect(INDICATOR_LABEL_KO[code]).not.toMatch(/^[A-Z_0-9]+$/);
    }
  });

  it('uses Korean primary characters in labels (no English fallback leak)', () => {
    expect(INDICATOR_LABEL_KO.USDKRW).toContain('원');
    expect(INDICATOR_LABEL_KO.KR_US_RATE_SPREAD).toContain('금리차');
    expect(INDICATOR_LABEL_KO.VIXCLS).toContain('변동성');
  });

  it('maps units appropriately (% / 원 / dimensionless)', () => {
    expect(INDICATOR_UNIT.KR_US_RATE_SPREAD).toBe('%p');
    expect(INDICATOR_UNIT.USDKRW).toBe('원');
    expect(INDICATOR_UNIT.VIXCLS).toBe('');
    expect(INDICATOR_UNIT.KR_10Y).toBe('%');
  });
});

describe('SERIES_FETCHABLE allow-list', () => {
  it('includes the 5 score-contributing single-series indicators', () => {
    expect(SERIES_FETCHABLE.has('KR_10Y')).toBe(true);
    expect(SERIES_FETCHABLE.has('USDKRW')).toBe(true);
    expect(SERIES_FETCHABLE.has('DGS10')).toBe(true);
    expect(SERIES_FETCHABLE.has('VIXCLS')).toBe(true);
    expect(SERIES_FETCHABLE.has('DTWEXBGS')).toBe(true);
  });

  it('excludes derived indicators', () => {
    expect(SERIES_FETCHABLE.has('KR_US_RATE_SPREAD')).toBe(false);
  });
});

describe('SPARKLINE_STROKE (cohort.ink-70 raw value)', () => {
  it('matches cohort.ink-70 from tailwind.config.ts (42 §6.2)', () => {
    expect(SPARKLINE_STROKE).toBe('#404040');
  });
});

describe('formatDelta', () => {
  it('returns null for null delta', () => {
    expect(formatDelta(null, '원')).toBeNull();
  });

  it('returns plain "0" with unit for exactly-zero delta', () => {
    expect(formatDelta(0, '%')).toBe('0 %');
  });

  it('uses + sign for positive delta', () => {
    expect(formatDelta(2.3, '원')).toBe('+2.30 원');
  });

  it('uses Unicode minus for negative delta', () => {
    expect(formatDelta(-1.5, '%')).toBe('−1.50 %');
  });
});

describe('formatIndicatorValue', () => {
  it('formats USDKRW with thousands separator', () => {
    expect(formatIndicatorValue(1387.5, 'USDKRW')).toBe('1,387.50');
  });
});

describe('formatObservationDate', () => {
  it('formats ISO date in ko-KR', () => {
    expect(formatObservationDate('2026-06-11')).toMatch(/\d/);
  });
});

describe('formatChartAxisDate', () => {
  it('returns short numeric date', () => {
    const out = formatChartAxisDate('2026-06-11');
    expect(out).toContain('6');
    expect(out).toContain('11');
  });
});

describe('contributionChip', () => {
  it('returns success-tinted chip for contribution ≥ +0.5', () => {
    expect(contributionChip(0.5)).toBe(
      'bg-cohort-success/10 text-cohort-success',
    );
  });

  it('returns danger-tinted chip for contribution ≤ −0.5', () => {
    expect(contributionChip(-0.5)).toBe(
      'bg-cohort-danger/10 text-cohort-danger',
    );
  });

  it('returns neutral chip for weak signals', () => {
    expect(contributionChip(0)).toBe('bg-cohort-ink-05 text-cohort-ink-70');
  });
});
