/**
 * Derive macro stance from composite score.
 * Pure helper extracted from cron route (Next.js App Router route file
 * cannot export arbitrary functions).
 */
export function deriveStance(
  score: number | undefined | null,
): 'hawkish' | 'dovish' | 'neutral' | undefined {
  if (typeof score !== 'number') return undefined;
  if (score <= -2.0) return 'hawkish';
  if (score >= 2.5) return 'dovish';
  return 'neutral';
}
