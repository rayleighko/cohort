import { describe, expect, it } from 'vitest';
import { redactPortfolioCompositionPct } from '@/lib/pipa-redact';

describe('redactPortfolioCompositionPct', () => {
  it('valid % composition → retain', () => {
    expect(redactPortfolioCompositionPct({ KOSPI: 60, US: 30, cash: 10 })).toEqual({
      KOSPI: 60,
      US: 30,
      cash: 10,
    });
  });

  it('absolute amount (> 100) → filter out', () => {
    expect(redactPortfolioCompositionPct({ KOSPI: 50000000, cash: 10 })).toEqual({ cash: 10 });
  });

  it('negative value → filter out', () => {
    expect(redactPortfolioCompositionPct({ KOSPI: -10, US: 50 })).toEqual({ US: 50 });
  });

  it('non-numeric value → filter out', () => {
    expect(redactPortfolioCompositionPct({ KOSPI: '60' as unknown as number, US: 40 })).toEqual({
      US: 40,
    });
  });

  it('2-decimal precision applied', () => {
    const result = redactPortfolioCompositionPct({ KOSPI: 33.333333 });
    expect(result).toEqual({ KOSPI: 33.33 });
  });

  it('boundary value 100 → retain', () => {
    expect(redactPortfolioCompositionPct({ KOSPI: 100 })).toEqual({ KOSPI: 100 });
  });

  it('boundary value 0 → retain', () => {
    expect(redactPortfolioCompositionPct({ cash: 0 })).toEqual({ cash: 0 });
  });

  it('null input → null', () => {
    expect(redactPortfolioCompositionPct(null)).toBeNull();
  });

  it('array input → null', () => {
    expect(redactPortfolioCompositionPct([60, 40])).toBeNull();
  });

  it('non-object input → null', () => {
    expect(redactPortfolioCompositionPct('60%')).toBeNull();
  });

  it('empty object → empty object', () => {
    expect(redactPortfolioCompositionPct({})).toEqual({});
  });
});
