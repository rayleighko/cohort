/**
 * Morning-brief lookup by macro asOfDate — avoids stale cross-day archive
 * and redundant Claude calls when a brief for the same data day exists.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { MacroComposite, MacroZone } from '@/lib/macro/composite';

export interface NarrationLogRow {
  text: string;
  category: string;
  composite_snapshot: unknown;
  created_at: string;
  triggered: boolean;
}

function asOfDateFromSnapshot(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const asOf = (snapshot as { asOfDate?: unknown }).asOfDate;
  return typeof asOf === 'string' && asOf.length > 0 ? asOf : null;
}

function zoneFromSnapshot(snapshot: unknown): MacroZone {
  if (!snapshot || typeof snapshot !== 'object') return 'neutral';
  const zone = (snapshot as { zone?: unknown }).zone;
  const valid: MacroZone[] = [
    'dovish',
    'neutral-dovish',
    'neutral',
    'neutral-hawkish',
    'hawkish',
  ];
  return valid.includes(zone as MacroZone) ? (zone as MacroZone) : 'neutral';
}

export async function fetchRecentMorningBriefs(
  limit = 30,
): Promise<NarrationLogRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('aurora_narration_log')
    .select('text, category, composite_snapshot, created_at, triggered')
    .eq('category', 'morning_brief')
    .eq('triggered', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Cohort] fetchRecentMorningBriefs error', error);
    return [];
  }
  return (data ?? []) as NarrationLogRow[];
}

export function findMorningBriefForAsOfDate(
  rows: NarrationLogRow[],
  asOfDate: string,
): NarrationLogRow | null {
  for (const row of rows) {
    if (asOfDateFromSnapshot(row.composite_snapshot) === asOfDate) {
      return row;
    }
  }
  return null;
}

export async function getCachedMorningBriefResponse(
  asOfDate: string,
  composite: MacroComposite,
): Promise<{
  character: 'aurora';
  text: string;
  triggered: false;
  zone: MacroZone;
  category: 'morning_brief';
} | null> {
  const rows = await fetchRecentMorningBriefs();
  const match = findMorningBriefForAsOfDate(rows, asOfDate);
  if (!match) return null;
  return {
    character: 'aurora',
    text: match.text,
    triggered: false,
    zone: zoneFromSnapshot(match.composite_snapshot) ?? composite.zone,
    category: 'morning_brief',
  };
}

export function toLatestNarration(row: NarrationLogRow) {
  return {
    text: row.text,
    category: 'morning_brief' as const,
    zone: zoneFromSnapshot(row.composite_snapshot),
    createdAt: row.created_at,
    asOfDate: asOfDateFromSnapshot(row.composite_snapshot),
    isArchive: true as const,
  };
}
