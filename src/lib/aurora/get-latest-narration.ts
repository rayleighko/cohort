/**
 * D25 archive fallback — fetch morning_brief for the current macro asOfDate
 * from aurora_narration_log so AuroraNarrationCard can first-paint without
 * showing a stale brief from a prior data day.
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
      return match ? toLatestNarration(match) : null;
    }

    return toLatestNarration(rows[0]);
  } catch (err) {
    console.error('[Cohort] getLatestNarration threw', err);
    return null;
  }
}
