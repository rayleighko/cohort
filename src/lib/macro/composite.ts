/**
 * Macro composite scorer — pure function, no I/O.
 *
 * Strategic Decision 0 Option B: emits zone labels + key driver only.
 * Never produces allocation, timing, or buy/sell directives.
 */
import type { EcosObservation } from './ecos';
import type { FredObservation } from './fred';

export type MacroZone =
  | 'dovish'
  | 'neutral-dovish'
  | 'neutral'
  | 'neutral-hawkish'
  | 'hawkish';

export interface MacroIndicator {
  source: 'ecos' | 'fred';
  code: string;
  latest: number;
  normalized: number;
  weight: number;
  contribution: number;
}

export interface MacroComposite {
  score: number;
  zone: MacroZone;
  keyDriver: { source: 'ecos' | 'fred'; code: string; contribution: number };
  indicators: MacroIndicator[];
  computedAt: string;
  asOfDate: string;
  degraded?: boolean;
  missingIndicators?: string[];
}

export interface ComputeMacroCompositeInput {
  ecos: Record<string, EcosObservation[]>;
  fred: Record<string, FredObservation[]>;
}

/** Base weights per 24-seo Page 5 / 25-w1 §5.3 (identical). */
const WEIGHTS = {
  kr_us_rate_spread: 0.25,
  krw_usd: 0.3,
  vix: 0.25,
  dxy: 0.2,
} as const;

function clamp10(n: number): number {
  return Math.max(-10, Math.min(10, n));
}

/** 24-seo Page 5: -10 at 2.5% wide, 0 at 1.25%, +10 at 0%. */
export function normalizeSpread(spread: number): number {
  return clamp10((1.25 - spread) * 8);
}

/** 24-seo Page 5: -10 at 1,550+, 0 at 1,350, +10 at 1,200 (asymmetric). */
export function normalizeKrw(krw: number): number {
  if (krw >= 1350) return clamp10((1350 - krw) / 20);
  return clamp10((1350 - krw) / 15);
}

/** 24-seo Page 5: -10 at 35, 0 at 20, +10 at 12 (asymmetric). */
export function normalizeVix(vix: number): number {
  if (vix >= 20) return clamp10((20 - vix) / 1.5);
  return clamp10((20 - vix) / 0.8);
}

/** 24-seo Page 5: -10 at 110, 0 at 100, +10 at 90 (symmetric). */
export function normalizeDxy(dxy: number): number {
  return clamp10(100 - dxy);
}

export function scoreToZone(score: number): MacroZone {
  if (score >= 5) return 'dovish';
  if (score >= 2) return 'neutral-dovish';
  if (score > -2) return 'neutral';
  if (score > -5) return 'neutral-hawkish';
  return 'hawkish';
}

function latestOf<T extends { date: string; value: number }>(
  obs: T[] | undefined,
): T | undefined {
  // Callers (ecos.ts / fred.ts) sort observations ascending by YYYY-MM-DD.
  if (!obs?.length) return undefined;
  return obs[obs.length - 1];
}

export function computeMacroComposite(
  input: ComputeMacroCompositeInput,
): MacroComposite {
  const krLatest = latestOf(input.ecos.KR_10Y);
  const krwLatest = latestOf(input.ecos.USDKRW);
  const usLatest = latestOf(input.fred.DGS10);
  const vixLatest = latestOf(input.fred.VIXCLS);
  const dxyLatest = latestOf(input.fred.DTWEXBGS);

  const missing: string[] = [];
  if (!krLatest) missing.push('ecos:KR_10Y');
  if (!krwLatest) missing.push('ecos:USDKRW');
  if (!usLatest) missing.push('fred:DGS10');
  if (!vixLatest) missing.push('fred:VIXCLS');
  if (!dxyLatest) missing.push('fred:DTWEXBGS');

  const present: MacroIndicator[] = [];

  if (krLatest && usLatest) {
    const spread = usLatest.value - krLatest.value;
    const normalized = normalizeSpread(spread);
    present.push({
      source: 'fred',
      code: 'KR_US_RATE_SPREAD',
      latest: spread,
      normalized,
      weight: WEIGHTS.kr_us_rate_spread,
      contribution: WEIGHTS.kr_us_rate_spread * normalized,
    });
  }

  if (krwLatest) {
    const normalized = normalizeKrw(krwLatest.value);
    present.push({
      source: 'ecos',
      code: 'USDKRW',
      latest: krwLatest.value,
      normalized,
      weight: WEIGHTS.krw_usd,
      contribution: WEIGHTS.krw_usd * normalized,
    });
  }

  if (vixLatest) {
    const normalized = normalizeVix(vixLatest.value);
    present.push({
      source: 'fred',
      code: 'VIXCLS',
      latest: vixLatest.value,
      normalized,
      weight: WEIGHTS.vix,
      contribution: WEIGHTS.vix * normalized,
    });
  }

  if (dxyLatest) {
    const normalized = normalizeDxy(dxyLatest.value);
    present.push({
      source: 'fred',
      code: 'DTWEXBGS',
      latest: dxyLatest.value,
      normalized,
      weight: WEIGHTS.dxy,
      contribution: WEIGHTS.dxy * normalized,
    });
  }

  if (present.length === 0) {
    throw new Error(
      'No macro indicators available — cannot compute composite',
    );
  }

  const totalBaseWeight = present.reduce((sum, i) => sum + i.weight, 0);
  const indicators: MacroIndicator[] = present.map((i) => {
    const reWeight = i.weight / totalBaseWeight;
    return {
      ...i,
      weight: reWeight,
      contribution: reWeight * i.normalized,
    };
  });

  const score = indicators.reduce((sum, i) => sum + i.contribution, 0);

  const keyDriverIndicator = indicators.reduce((a, b) =>
    Math.abs(a.contribution) >= Math.abs(b.contribution) ? a : b,
  );

  const asOfDate =
    [krLatest, krwLatest, usLatest, vixLatest, dxyLatest].reduce<string>(
      (max, o) => (o && o.date > max ? o.date : max),
      '',
    ) || new Date().toISOString().slice(0, 10);

  const result: MacroComposite = {
    score,
    zone: scoreToZone(score),
    keyDriver: {
      source: keyDriverIndicator.source,
      code: keyDriverIndicator.code,
      contribution: keyDriverIndicator.contribution,
    },
    indicators,
    computedAt: new Date().toISOString(),
    asOfDate,
  };
  if (missing.length > 0) {
    result.degraded = true;
    result.missingIndicators = missing;
  }
  return result;
}
