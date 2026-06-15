/**
 * KST calendar dates for macro fetches.
 *
 * ECOS/FRED "as of" days follow Korean market calendar; using UTC
 * `toISOString().slice(0, 10)` rolls the window back half a day for KST
 * users and can pin stale observations through ISR + in-memory cache.
 */

/** YYYY-MM-DD for "today" in Asia/Seoul. */
export function kstTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
}

/** YYYY-MM-DD for N calendar days before KST today. */
export function kstDaysAgoIso(daysAgo: number): string {
  const [y, m, d] = kstTodayIso().split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - daysAgo);
  return utc.toISOString().slice(0, 10);
}

export function kstMacroDateRange(daysBack = 30): { start: string; end: string } {
  return {
    start: kstDaysAgoIso(daysBack),
    end: kstTodayIso(),
  };
}
