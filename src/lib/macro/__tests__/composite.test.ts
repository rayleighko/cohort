import { describe, expect, it } from 'vitest';
import {
  computeMacroComposite,
  normalizeDxy,
  normalizeKrw,
  normalizeSpread,
  normalizeVix,
  scoreToZone,
  type ComputeMacroCompositeInput,
} from '../composite';
import type { EcosObservation } from '../ecos';
import type { FredObservation } from '../fred';

function obs(date: string, value: number): EcosObservation & FredObservation {
  return { date, value };
}

const DATE = '2026-05-22';

describe('normalize functions (24-seo Page 5 calibration, Option α)', () => {
  describe('normalizeSpread', () => {
    it('returns +10 at spread = 0', () => {
      expect(normalizeSpread(0)).toBe(10);
    });
    it('returns 0 at spread = 1.25', () => {
      expect(normalizeSpread(1.25)).toBe(0);
    });
    it('returns -10 at spread = 2.5', () => {
      expect(normalizeSpread(2.5)).toBe(-10);
    });
    it('clamps to -10 below', () => {
      expect(normalizeSpread(3.0)).toBe(-10);
    });
    it('clamps to +10 above', () => {
      expect(normalizeSpread(-0.5)).toBe(10);
    });
  });

  describe('normalizeKrw (asymmetric piecewise)', () => {
    it('returns +10 at krw = 1200', () => {
      expect(normalizeKrw(1200)).toBe(10);
    });
    it('returns 0 at krw = 1350', () => {
      expect(normalizeKrw(1350)).toBe(0);
    });
    it('returns -10 at krw = 1550', () => {
      expect(normalizeKrw(1550)).toBe(-10);
    });
    it('clamps at -10 above 1550', () => {
      expect(normalizeKrw(1700)).toBe(-10);
    });
    it('clamps at +10 below 1200', () => {
      expect(normalizeKrw(1100)).toBe(10);
    });
    it('uses lower-slope (÷20) above 1350', () => {
      // (1350 - 1450) / 20 = -5
      expect(normalizeKrw(1450)).toBe(-5);
    });
    it('uses upper-slope (÷15) below 1350', () => {
      // (1350 - 1275) / 15 = +5
      expect(normalizeKrw(1275)).toBe(5);
    });
  });

  describe('normalizeVix (asymmetric piecewise)', () => {
    it('returns +10 at vix = 12', () => {
      expect(normalizeVix(12)).toBe(10);
    });
    it('returns 0 at vix = 20', () => {
      expect(normalizeVix(20)).toBe(0);
    });
    it('returns -10 at vix = 35', () => {
      expect(normalizeVix(35)).toBe(-10);
    });
    it('clamps at +10 below 12', () => {
      expect(normalizeVix(8)).toBe(10);
    });
    it('clamps at -10 above 35', () => {
      expect(normalizeVix(50)).toBe(-10);
    });
  });

  describe('normalizeDxy', () => {
    it('returns +10 at dxy = 90', () => {
      expect(normalizeDxy(90)).toBe(10);
    });
    it('returns 0 at dxy = 100', () => {
      expect(normalizeDxy(100)).toBe(0);
    });
    it('returns -10 at dxy = 110', () => {
      expect(normalizeDxy(110)).toBe(-10);
    });
    it('clamps at -10 above 110', () => {
      expect(normalizeDxy(120)).toBe(-10);
    });
    it('clamps at +10 below 90', () => {
      expect(normalizeDxy(80)).toBe(10);
    });
  });
});

describe('scoreToZone', () => {
  it('maps score >= 5 to dovish (boundary closed at +5)', () => {
    expect(scoreToZone(5)).toBe('dovish');
    expect(scoreToZone(7.2)).toBe('dovish');
  });
  it('maps [2, 5) to neutral-dovish', () => {
    expect(scoreToZone(2)).toBe('neutral-dovish');
    expect(scoreToZone(4.9)).toBe('neutral-dovish');
  });
  it('maps (-2, 2) to neutral', () => {
    expect(scoreToZone(0)).toBe('neutral');
    expect(scoreToZone(1.9)).toBe('neutral');
    expect(scoreToZone(-1.9)).toBe('neutral');
  });
  it('maps (-5, -2] to neutral-hawkish', () => {
    expect(scoreToZone(-2)).toBe('neutral-hawkish');
    expect(scoreToZone(-4.9)).toBe('neutral-hawkish');
  });
  it('maps score <= -5 to hawkish (boundary closed at -5)', () => {
    expect(scoreToZone(-5)).toBe('hawkish');
    expect(scoreToZone(-7.5)).toBe('hawkish');
  });
});

describe('computeMacroComposite', () => {
  function fullInput(values: {
    kr10y: number;
    us10y: number;
    krw: number;
    vix: number;
    dxy: number;
  }): ComputeMacroCompositeInput {
    return {
      ecos: {
        KR_10Y: [obs(DATE, values.kr10y)],
        USDKRW: [obs(DATE, values.krw)],
      },
      fred: {
        DGS10: [obs(DATE, values.us10y)],
        VIXCLS: [obs(DATE, values.vix)],
        DTWEXBGS: [obs(DATE, values.dxy)],
      },
    };
  }

  it('computes composite with all 4 contributing indicators (standard case)', () => {
    // spread = 4.25 - 3.25 = 1.0 → normalize(1.0) = (1.25 - 1.0) * 8 = 2.0
    // krw = 1365 → (1350 - 1365) / 20 = -0.75
    // vix = 16.5 → (20 - 16.5) / 0.8 = 4.375
    // dxy = 103 → 100 - 103 = -3
    // score = 0.25*2.0 + 0.30*(-0.75) + 0.25*4.375 + 0.20*(-3)
    //       = 0.5 - 0.225 + 1.09375 - 0.6 = 0.76875
    const result = computeMacroComposite(
      fullInput({ kr10y: 3.25, us10y: 4.25, krw: 1365, vix: 16.5, dxy: 103 }),
    );
    expect(result.indicators).toHaveLength(4);
    expect(result.score).toBeCloseTo(0.76875, 5);
    expect(result.zone).toBe('neutral');
    expect(result.degraded).toBeUndefined();
    expect(result.missingIndicators).toBeUndefined();
    expect(result.asOfDate).toBe(DATE);
  });

  it('maps fully dovish-leaning inputs to dovish zone', () => {
    // spread → 0 (narrow), krw → 1200 (strong KRW), vix → 12 (low),
    // dxy → 90 (weak USD) → all +10 → score = +10
    const result = computeMacroComposite(
      fullInput({ kr10y: 4.25, us10y: 4.25, krw: 1200, vix: 12, dxy: 90 }),
    );
    expect(result.score).toBe(10);
    expect(result.zone).toBe('dovish');
  });

  it('maps fully hawkish-leaning inputs to hawkish zone', () => {
    // spread = 2.5 (wide) → -10, krw 1550 → -10, vix 35 → -10, dxy 110 → -10
    // → score = -10
    const result = computeMacroComposite(
      fullInput({ kr10y: 2.0, us10y: 4.5, krw: 1550, vix: 35, dxy: 110 }),
    );
    expect(result.score).toBe(-10);
    expect(result.zone).toBe('hawkish');
  });

  it('degrades gracefully when DXY is missing (re-weights remaining)', () => {
    const input: ComputeMacroCompositeInput = {
      ecos: {
        KR_10Y: [obs(DATE, 3.25)],
        USDKRW: [obs(DATE, 1365)],
      },
      fred: {
        DGS10: [obs(DATE, 4.25)],
        VIXCLS: [obs(DATE, 16.5)],
        // DTWEXBGS missing
      },
    };
    const result = computeMacroComposite(input);
    expect(result.degraded).toBe(true);
    expect(result.missingIndicators).toEqual(['fred:DTWEXBGS']);
    expect(result.indicators).toHaveLength(3); // spread, krw, vix
    // Re-normalized weights: 0.25 + 0.30 + 0.25 = 0.80 base; each scaled by 1/0.80
    const totalWeight = result.indicators.reduce((s, i) => s + i.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 6);
  });

  it('degrades when KR_10Y is missing (spread indicator drops out)', () => {
    const input: ComputeMacroCompositeInput = {
      ecos: {
        // KR_10Y missing → no spread indicator
        USDKRW: [obs(DATE, 1365)],
      },
      fred: {
        DGS10: [obs(DATE, 4.25)],
        VIXCLS: [obs(DATE, 16.5)],
        DTWEXBGS: [obs(DATE, 103)],
      },
    };
    const result = computeMacroComposite(input);
    expect(result.degraded).toBe(true);
    expect(result.missingIndicators).toContain('ecos:KR_10Y');
    // Spread requires both KR_10Y + DGS10; KR_10Y missing → no spread row
    expect(result.indicators.find((i) => i.code === 'KR_US_RATE_SPREAD')).toBeUndefined();
    expect(result.indicators).toHaveLength(3); // krw, vix, dxy
  });

  it('throws when all indicators are missing', () => {
    expect(() =>
      computeMacroComposite({ ecos: {}, fred: {} }),
    ).toThrow(/No macro indicators available/);
  });

  it('identifies key driver as the indicator with largest |contribution|', () => {
    // VIX 35 → -10 normalized → contribution ≈ 0.25 * -10 = -2.5
    // Other indicators all near zero, so VIX dominates
    const result = computeMacroComposite(
      fullInput({ kr10y: 3.25, us10y: 4.5, krw: 1350, vix: 35, dxy: 100 }),
    );
    expect(result.keyDriver.code).toBe('VIXCLS');
    expect(Math.abs(result.keyDriver.contribution)).toBeGreaterThan(0);
  });

  it('selects the most recent date as asOfDate', () => {
    const input: ComputeMacroCompositeInput = {
      ecos: {
        KR_10Y: [obs('2026-05-20', 3.25), obs('2026-05-22', 3.30)],
        USDKRW: [obs('2026-05-22', 1365)],
      },
      fred: {
        DGS10: [obs('2026-05-22', 4.25)],
        VIXCLS: [obs('2026-05-21', 16.5)],
        DTWEXBGS: [obs('2026-05-22', 103)],
      },
    };
    const result = computeMacroComposite(input);
    expect(result.asOfDate).toBe('2026-05-22');
  });

  it('emits ISO 8601 UTC computedAt', () => {
    const result = computeMacroComposite(
      fullInput({ kr10y: 3.25, us10y: 4.25, krw: 1350, vix: 20, dxy: 100 }),
    );
    expect(result.computedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
    );
  });

  it('uses latest observation across multi-point series', () => {
    const input: ComputeMacroCompositeInput = {
      ecos: {
        KR_10Y: [obs('2026-05-20', 5.0), obs('2026-05-22', 3.25)],
        USDKRW: [obs('2026-05-22', 1365)],
      },
      fred: {
        DGS10: [obs('2026-05-22', 4.25)],
        VIXCLS: [obs('2026-05-22', 16.5)],
        DTWEXBGS: [obs('2026-05-22', 103)],
      },
    };
    const result = computeMacroComposite(input);
    const spread = result.indicators.find(
      (i) => i.code === 'KR_US_RATE_SPREAD',
    );
    // Uses latest KR_10Y (3.25), not earliest (5.0)
    expect(spread?.latest).toBeCloseTo(4.25 - 3.25, 5);
  });
});
