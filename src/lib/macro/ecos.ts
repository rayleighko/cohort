/**
 * 한국은행 ECOS API client.
 * Day 1 = fixture stub (ECOS_API_KEY is a W2 prerequisite). Returns fixed
 * sample values so composite-score.ts and the dashboard can render.
 * TODO(W2): real ECOS fetch once the operator provides ECOS_API_KEY.
 */

const ECOS_FIXTURES: Record<string, number> = {
  KR_10Y: 3.25, // 한국 국고채 10년 수익률 (%)
  USDKRW: 1365.0, // 원/달러 환율
};

export async function fetchEcosRate(seriesKey: string): Promise<number> {
  // TODO(W2): if (process.env.ECOS_API_KEY) { ...real fetch... }
  return ECOS_FIXTURES[seriesKey] ?? 0;
}
