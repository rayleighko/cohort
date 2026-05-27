/**
 * D25 archive fallback — fetch the most recent morning_brief narration from
 * aurora_narration_log so AuroraNarrationCard can first-paint immediately
 * instead of showing a 1-3 second skeleton (vault 61 v2 D25, CEO confirm
 * 2026-05-27).
 *
 * Server-side only. Uses the service-role admin client so the helper works
 * regardless of caller auth state (Tier 0 anonymous dashboard).
 *
 * PIPA boundary: aurora_narration_log is Tier 0 public-only — composite_snapshot
 * holds aggregate ECOS/FRED macro values, no user identifier. See vault 14
 * §14.5 narration table separation contract (CEO Q3 future-proof).
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { MacroZone } from '@/lib/macro/composite';

export interface LatestNarration {
  text: string;
  category: 'morning_brief';
  zone: MacroZone;
  createdAt: string;
  isArchive: true;
}

export async function getLatestNarration(): Promise<LatestNarration | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('aurora_narration_log')
      .select('text, category, composite_snapshot, created_at')
      .eq('category', 'morning_brief')
      .eq('triggered', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Cohort] getLatestNarration error', error);
      return null;
    }
    if (!data) return null;

    const snapshot = data.composite_snapshot as { zone?: MacroZone } | null;
    const zone: MacroZone = snapshot?.zone ?? 'neutral';

    return {
      text: data.text,
      category: 'morning_brief',
      zone,
      createdAt: data.created_at,
      isArchive: true,
    };
  } catch (err) {
    console.error('[Cohort] getLatestNarration threw', err);
    return null;
  }
}
