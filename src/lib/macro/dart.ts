/**
 * 금융감독원 DART OPEN API client — 공시 (corporate disclosure) data.
 * Day 1 = fixture stub (DART_API_KEY is a W2 prerequisite).
 * TODO(W2-W3): real DART 공시 list fetch + watchlist disclosure alerts.
 */

export interface DisclosureItem {
  ticker: string;
  title: string;
  publishedAt: string;
}

export async function fetchRecentDisclosures(
  _ticker?: string,
): Promise<DisclosureItem[]> {
  // TODO(W2): if (process.env.DART_API_KEY) { ...real fetch... }
  return [];
}
