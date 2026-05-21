/**
 * St. Louis Fed FRED API client.
 * Day 1 = fixture stub (FRED_API_KEY is a W2 prerequisite).
 * TODO(W2): real FRED series fetch once the operator provides FRED_API_KEY.
 */

const FRED_FIXTURES: Record<string, number> = {
  DGS10: 4.25, // US 10-Year Treasury yield (%)
  VIXCLS: 16.5, // CBOE Volatility Index
  DTWEXBGS: 103.0, // Trade-weighted USD index proxy
};

export async function fetchFredSeries(seriesId: string): Promise<number> {
  // TODO(W2): if (process.env.FRED_API_KEY) { ...real fetch... }
  return FRED_FIXTURES[seriesId] ?? 0;
}
