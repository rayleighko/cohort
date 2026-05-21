/**
 * Macro composite score — Shape A.
 * Normalizes 4 macro factors to a -10..+10 band, then weights into a composite.
 * Per 25-spec §5.3. Data sources are fixture stubs until W2.
 */
import { fetchEcosRate } from './ecos';
import { fetchFredSeries } from './fred';
import type { MacroScores } from '@/types/shapes';

const WEIGHTS = {
  kr_us_rate_spread: 0.25,
  krw_usd: 0.3,
  vix: 0.25,
  dxy: 0.2,
} as const;

function clamp10(n: number): number {
  return Math.max(-10, Math.min(10, n));
}

function normalizeSpread(spread: number): number {
  return clamp10((2.5 - spread) * 4);
}

function normalizeKrw(krw: number): number {
  return clamp10((1350 - krw) / 20);
}

function normalizeVix(vix: number): number {
  return clamp10(20 - vix);
}

function normalizeDxy(dxy: number): number {
  return clamp10((100 - dxy) / 2);
}

export async function computeCompositeScore(): Promise<MacroScores> {
  const [usRate10Y, krRate10Y, krw, vix, dxy] = await Promise.all([
    fetchFredSeries('DGS10'),
    fetchEcosRate('KR_10Y'),
    fetchEcosRate('USDKRW'),
    fetchFredSeries('VIXCLS'),
    fetchFredSeries('DTWEXBGS'),
  ]);

  const spread = usRate10Y - krRate10Y;

  const scores = {
    kr_us_rate_spread: normalizeSpread(spread),
    krw_usd: normalizeKrw(krw),
    vix: normalizeVix(vix),
    dxy: normalizeDxy(dxy),
  };

  const composite =
    WEIGHTS.kr_us_rate_spread * scores.kr_us_rate_spread +
    WEIGHTS.krw_usd * scores.krw_usd +
    WEIGHTS.vix * scores.vix +
    WEIGHTS.dxy * scores.dxy;

  return { ...scores, composite };
}
