/**
 * Shape C — panic / FOMO behavioral pattern detection.
 * Detects rapid-action patterns that warrant a soft-pause nudge ("잠시 멈춰볼까요").
 * V1 minimum heuristics only (Sprint 0 scope).
 */

import type {
  FomoContext,
  FomoResult,
  PanicContext,
  PanicResult,
} from '@/types/trigger';

export type BehavioralPattern = 'panic' | 'fomo' | 'none';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isWithinLast24Hours(now: Date, target: Date): boolean {
  const delta = now.getTime() - target.getTime();
  return delta >= 0 && delta <= ONE_DAY_MS;
}

function severityFromMatches(count: number): 'low' | 'medium' | 'high' {
  if (count >= 3) return 'high';
  if (count === 2) return 'medium';
  return 'low';
}

export function detectPanic(ctx: PanicContext): PanicResult {
  const sells24h = ctx.recentSells.filter((sell) =>
    isWithinLast24Hours(ctx.now, sell.sold_at),
  );

  const unplannedSells = sells24h.filter((sell) => !sell.planned);
  const totalSellAmount = sells24h.reduce((sum, sell) => sum + sell.amount_krw, 0);
  const largestSingleSell = sells24h.reduce(
    (max, sell) => Math.max(max, sell.amount_krw),
    0,
  );

  const safePlanTotal = Math.max(ctx.planTotalKrw, 0);
  const sellRatio = safePlanTotal > 0 ? totalSellAmount / safePlanTotal : 0;

  const evidence = {
    unplannedSellCountGte2: unplannedSells.length >= 2,
    sellRatioGte20Pct: sellRatio >= 0.2,
    hawkishMacroAndSingleSellGte30Pct:
      ctx.macroCompositeScore <= -2.0 &&
      safePlanTotal > 0 &&
      largestSingleSell >= safePlanTotal * 0.3,
  };

  const matchedCount = Object.values(evidence).filter(Boolean).length;
  const detected = matchedCount > 0;
  const sellRatioPct = (sellRatio * 100).toFixed(1);

  return {
    detected,
    severity: severityFromMatches(matchedCount),
    reason: detected
      ? `24h 내 plan 위반 매도 ${unplannedSells.length}회, 매도 합산 ${sellRatioPct}% of plan`
      : '24h 내 panic heuristic 미충족',
    evidence,
  };
}

export function detectFOMO(ctx: FomoContext): FomoResult {
  const buys24h = ctx.recentBuys.filter((buy) =>
    isWithinLast24Hours(ctx.now, buy.bought_at),
  );

  const outsideWatchlistBuys = buys24h.filter((buy) => !buy.in_watchlist);
  const totalBuyAmount = buys24h.reduce((sum, buy) => sum + buy.amount_krw, 0);
  const safePlanTotal = Math.max(ctx.planTotalKrw, 0);
  const buyRatio = safePlanTotal > 0 ? totalBuyAmount / safePlanTotal : 0;

  const evidence = {
    outsideWatchlistBuyExists: outsideWatchlistBuys.length >= 1,
    buyRatioGte150Pct: buyRatio >= 1.5,
    dovishMacroAndOutsideWatchlistBuy:
      ctx.macroCompositeScore >= 2.5 && outsideWatchlistBuys.length >= 1,
  };

  const matchedCount = Object.values(evidence).filter(Boolean).length;
  const detected = matchedCount > 0;
  const buyRatioPct = (buyRatio * 100).toFixed(1);

  return {
    detected,
    severity: severityFromMatches(matchedCount),
    reason: detected
      ? `24h 내 watchlist 밖 매수 ${outsideWatchlistBuys.length}회, 매수 합산 ${buyRatioPct}% of plan`
      : '24h 내 fomo heuristic 미충족',
    evidence,
  };
}

export function detectBehavioralPattern(
  panicCtx: PanicContext,
  fomoCtx: FomoContext,
): BehavioralPattern {
  const panic = detectPanic(panicCtx);
  if (panic.detected) {
    return 'panic';
  }

  const fomo = detectFOMO(fomoCtx);
  if (fomo.detected) {
    return 'fomo';
  }

  return 'none';
}
