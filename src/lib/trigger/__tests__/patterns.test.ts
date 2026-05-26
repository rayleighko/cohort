import { describe, expect, it, vi } from 'vitest';
import { detectFOMO, detectPanic } from '../patterns';

const OPTION_B_FORBIDDEN_REGEX =
  /추천|권장|매수\s*자제|매도\s*자제|recommend|should\s+(buy|sell)/i;

const NOW = new Date('2026-05-26T10:00:00.000Z');

describe('detectPanic', () => {
  it('detects low severity when only unplanned sell count condition matches', () => {
    const dateNowSpy = vi.spyOn(Date, 'now');
    const result = detectPanic({
      userId: 'user-1',
      now: NOW,
      recentSells: [
        { ticker: 'AAA', amount_krw: 100_000, planned: false, sold_at: new Date('2026-05-26T09:30:00.000Z') },
        { ticker: 'BBB', amount_krw: 50_000, planned: false, sold_at: new Date('2026-05-26T09:00:00.000Z') },
      ],
      planTotalKrw: 1_000_000,
      macroCompositeScore: -1.5,
    });

    expect(result.detected).toBe(true);
    expect(result.severity).toBe('low');
    expect(result.evidence.unplannedSellCountGte2).toBe(true);
    expect(result.evidence.sellRatioGte20Pct).toBe(false);
    expect(result.evidence.hawkishMacroAndSingleSellGte30Pct).toBe(false);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
    expect(dateNowSpy).toHaveBeenCalledTimes(0);
    dateNowSpy.mockRestore();
  });

  it('detects low severity when only sell ratio condition matches', () => {
    const result = detectPanic({
      userId: 'user-1',
      now: NOW,
      recentSells: [
        { ticker: 'AAA', amount_krw: 220_000, planned: true, sold_at: new Date('2026-05-26T09:30:00.000Z') },
      ],
      planTotalKrw: 1_000_000,
      macroCompositeScore: -1.0,
    });

    expect(result.detected).toBe(true);
    expect(result.severity).toBe('low');
    expect(result.evidence.unplannedSellCountGte2).toBe(false);
    expect(result.evidence.sellRatioGte20Pct).toBe(true);
    expect(result.evidence.hawkishMacroAndSingleSellGte30Pct).toBe(false);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
  });

  it('detects medium severity when hawkish+single-sell implies ratio condition', () => {
    const result = detectPanic({
      userId: 'user-1',
      now: NOW,
      recentSells: [
        { ticker: 'AAA', amount_krw: 500_000, planned: true, sold_at: new Date('2026-05-26T09:30:00.000Z') },
      ],
      planTotalKrw: 1_500_000,
      macroCompositeScore: -2.2,
    });

    expect(result.detected).toBe(true);
    expect(result.severity).toBe('medium');
    expect(result.evidence.unplannedSellCountGte2).toBe(false);
    expect(result.evidence.sellRatioGte20Pct).toBe(true);
    expect(result.evidence.hawkishMacroAndSingleSellGte30Pct).toBe(true);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
  });

  it('detects high severity when all three panic conditions match', () => {
    const result = detectPanic({
      userId: 'user-1',
      now: NOW,
      recentSells: [
        { ticker: 'AAA', amount_krw: 350_000, planned: false, sold_at: new Date('2026-05-26T09:45:00.000Z') },
        { ticker: 'BBB', amount_krw: 100_000, planned: false, sold_at: new Date('2026-05-26T09:30:00.000Z') },
      ],
      planTotalKrw: 1_000_000,
      macroCompositeScore: -2.5,
    });

    expect(result.detected).toBe(true);
    expect(result.severity).toBe('high');
    expect(result.evidence.unplannedSellCountGte2).toBe(true);
    expect(result.evidence.sellRatioGte20Pct).toBe(true);
    expect(result.evidence.hawkishMacroAndSingleSellGte30Pct).toBe(true);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
  });

  it('does not detect panic when no condition matches', () => {
    const result = detectPanic({
      userId: 'user-1',
      now: NOW,
      recentSells: [
        { ticker: 'AAA', amount_krw: 50_000, planned: true, sold_at: new Date('2026-05-26T09:30:00.000Z') },
      ],
      planTotalKrw: 1_000_000,
      macroCompositeScore: -1.0,
    });

    expect(result.detected).toBe(false);
    expect(result.evidence.unplannedSellCountGte2).toBe(false);
    expect(result.evidence.sellRatioGte20Pct).toBe(false);
    expect(result.evidence.hawkishMacroAndSingleSellGte30Pct).toBe(false);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
  });
});

describe('detectFOMO', () => {
  it('detects low severity when only outside-watchlist condition matches', () => {
    const dateNowSpy = vi.spyOn(Date, 'now');
    const result = detectFOMO({
      userId: 'user-1',
      now: NOW,
      recentBuys: [
        { ticker: 'CCC', amount_krw: 100_000, in_watchlist: false, bought_at: new Date('2026-05-26T09:30:00.000Z') },
      ],
      planTotalKrw: 1_000_000,
      macroCompositeScore: 1.0,
    });

    expect(result.detected).toBe(true);
    expect(result.severity).toBe('low');
    expect(result.evidence.outsideWatchlistBuyExists).toBe(true);
    expect(result.evidence.buyRatioGte150Pct).toBe(false);
    expect(result.evidence.dovishMacroAndOutsideWatchlistBuy).toBe(false);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
    expect(dateNowSpy).toHaveBeenCalledTimes(0);
    dateNowSpy.mockRestore();
  });

  it('detects low severity when only buy ratio condition matches', () => {
    const result = detectFOMO({
      userId: 'user-1',
      now: NOW,
      recentBuys: [
        { ticker: 'AAA', amount_krw: 1_600_000, in_watchlist: true, bought_at: new Date('2026-05-26T09:30:00.000Z') },
      ],
      planTotalKrw: 1_000_000,
      macroCompositeScore: 1.5,
    });

    expect(result.detected).toBe(true);
    expect(result.severity).toBe('low');
    expect(result.evidence.outsideWatchlistBuyExists).toBe(false);
    expect(result.evidence.buyRatioGte150Pct).toBe(true);
    expect(result.evidence.dovishMacroAndOutsideWatchlistBuy).toBe(false);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
  });

  it('detects medium severity when dovish+outside-watchlist implies outside condition', () => {
    const result = detectFOMO({
      userId: 'user-1',
      now: NOW,
      recentBuys: [
        { ticker: 'CCC', amount_krw: 100_000, in_watchlist: false, bought_at: new Date('2026-05-26T09:30:00.000Z') },
      ],
      planTotalKrw: 10_000_000,
      macroCompositeScore: 2.6,
    });

    expect(result.detected).toBe(true);
    expect(result.severity).toBe('medium');
    expect(result.evidence.outsideWatchlistBuyExists).toBe(true);
    expect(result.evidence.buyRatioGte150Pct).toBe(false);
    expect(result.evidence.dovishMacroAndOutsideWatchlistBuy).toBe(true);
    expect(result.reason).not.toMatch(OPTION_B_FORBIDDEN_REGEX);
  });
});
