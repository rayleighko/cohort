import { describe, it, expect } from 'vitest';
import {
  INDICATOR_LABEL_KO,
  INDICATOR_UNIT,
  SERIES_FETCHABLE,
  SPARKLINE_STROKE,
  formatDelta,
  contributionAccent,
} from '@/components/shape-a/IndicatorCard';

// IndicatorCard's React rendering is verified manually on /dashboard
// during operator sign-off (no @testing-library/react in this project
// — DOM testing infrastructure adoption is a W3 prereq). These tests
// cover the pure logic: label/unit lookup, fetchable allow-list, delta
// formatting, contribution-sign accent mapping, and the sparkline-stroke
// token reference.

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

describe('SERIES_FETCHABLE allow-list (must match /api/macro/series allow-list)', () => {
  it('includes the 5 score-contributing single-series indicators', () => {
    expect(SERIES_FETCHABLE.has('KR_10Y')).toBe(true);
    expect(SERIES_FETCHABLE.has('USDKRW')).toBe(true);
    expect(SERIES_FETCHABLE.has('DGS10')).toBe(true);
    expect(SERIES_FETCHABLE.has('VIXCLS')).toBe(true);
    expect(SERIES_FETCHABLE.has('DTWEXBGS')).toBe(true);
  });

  it('excludes derived (composite-only) indicators that have no standalone series', () => {
    expect(SERIES_FETCHABLE.has('KR_US_RATE_SPREAD')).toBe(false);
  });

  it('does not accept arbitrary strings (set membership type)', () => {
    expect(SERIES_FETCHABLE.has('BTCUSD')).toBe(false);
    expect(SERIES_FETCHABLE.has('')).toBe(false);
  });
});

describe('SPARKLINE_STROKE (cohort.ink-70 raw value)', () => {
  it('matches cohort.ink-70 from tailwind.config.ts (42 §6.2)', () => {
    // cohort.ink-70 = '#404040' per tailwind.config.ts + 42 §6.2.
    // If this value drifts, both files must update together (AD-1 hygiene).
    expect(SPARKLINE_STROKE).toBe('#404040');
  });
});

describe('formatDelta', () => {
  it('returns null for null delta (no series available)', () => {
    expect(formatDelta(null, '원')).toBeNull();
    expect(formatDelta(null, '')).toBeNull();
  });

  it('returns plain "0" with unit for exactly-zero delta', () => {
    expect(formatDelta(0, '%')).toBe('0 %');
    expect(formatDelta(0, '')).toBe('0');
  });

  it('uses + sign for positive delta with 2 decimals (small magnitudes)', () => {
    expect(formatDelta(0.45, '%')).toBe('+0.45 %');
    expect(formatDelta(2.3, '원')).toBe('+2.30 원');
  });

  it('uses Unicode minus (−) for negative delta, not ASCII hyphen', () => {
    const out = formatDelta(-1.5, '%');
    expect(out).toBe('−1.50 %');
    expect(out).not.toContain('-1');
  });

  it('drops decimals when magnitude ≥ 100 (avoid cramped sparkline header)', () => {
    expect(formatDelta(123.4, '원')).toBe('+123 원');
    expect(formatDelta(-1500, '원')).toBe('−1500 원');
  });

  it('omits trailing space when unit is empty (VIX, DXY)', () => {
    expect(formatDelta(1.5, '')).toBe('+1.50');
    expect(formatDelta(-0.3, '')).toBe('−0.30');
  });
});

describe('contributionAccent (state-color rule: border-only)', () => {
  it('returns success border for contribution ≥ +0.5 (dovish leg)', () => {
    expect(contributionAccent(0.5)).toBe('border-l-cohort-success');
    expect(contributionAccent(2.4)).toBe('border-l-cohort-success');
    expect(contributionAccent(10)).toBe('border-l-cohort-success');
  });

  it('returns danger border for contribution ≤ −0.5 (hawkish leg)', () => {
    expect(contributionAccent(-0.5)).toBe('border-l-cohort-danger');
    expect(contributionAccent(-4.4)).toBe('border-l-cohort-danger');
    expect(contributionAccent(-10)).toBe('border-l-cohort-danger');
  });

  it('returns neutral ink-30 border for weak signals (|contribution| < 0.5)', () => {
    expect(contributionAccent(0)).toBe('border-l-cohort-ink-30');
    expect(contributionAccent(0.49)).toBe('border-l-cohort-ink-30');
    expect(contributionAccent(-0.49)).toBe('border-l-cohort-ink-30');
  });

  it('never returns a body-text token (state-color rule compliance)', () => {
    const samples = [-10, -1, 0, 0.3, 2.5, 10];
    for (const c of samples) {
      const out = contributionAccent(c);
      expect(out).toMatch(/^border-l-cohort-/);
      // body-text-restricted tokens must never appear:
      expect(out).not.toContain('text-cohort-success');
      expect(out).not.toContain('text-cohort-warning');
      expect(out).not.toContain('text-cohort-danger');
    }
  });
});
