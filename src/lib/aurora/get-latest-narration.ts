/**
 * D25 archive fallback — morning_brief for dashboard first paint.
 * Prefers exact macro asOfDate; falls back to most recent stored brief
 * (stale-day annotation in UI) so the collapsible block is not empty.
 */
import {
  fetchRecentMorningBriefs,
  findMorningBriefForAsOfDate,
  toLatestNarration,
} from '@/lib/aurora/narration-cache';

export interface LatestNarration {
  text: string;
  category: 'morning_brief';
  zone: import('@/lib/macro/composite').MacroZone;
  createdAt: string;
  asOfDate: string | null;
  isArchive: true;
}

export async function getLatestNarration(
  preferredAsOfDate?: string,
): Promise<LatestNarration | null> {
  try {
    const rows = await fetchRecentMorningBriefs();
    if (rows.length === 0) return null;

    if (preferredAsOfDate) {
      const match = findMorningBriefForAsOfDate(rows, preferredAsOfDate);
      if (match) return toLatestNarration(match);
      // Stale-day fallback — still paint archive while client POST generates today.
      return toLatestNarration(rows[0]);
    }

    return toLatestNarration(rows[0]);
  } catch (err) {
    console.error('[Cohort] getLatestNarration threw', err);
    return null;
  }
}
