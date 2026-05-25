export function redactPortfolioCompositionPct(
  raw: unknown,
): Record<string, number> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v !== 'number') continue;
    if (v < 0 || v > 100) continue;
    out[k] = Math.round(v * 100) / 100;
  }
  return out;
}
