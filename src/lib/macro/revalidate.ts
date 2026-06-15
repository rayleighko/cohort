/** Shared macro freshness window (seconds). Default 15 min — vault 60 Layer 1 daily cache is separate. */
export function getMacroRevalidateSeconds(): number {
  const sec = Number(process.env.MACRO_REVALIDATE_SECONDS ?? 900);
  return Number.isFinite(sec) && sec > 0 ? sec : 900;
}

export const MACRO_FETCH_CACHE_TTL_SECONDS = (): number => {
  const sec = Number(process.env.MACRO_FETCH_CACHE_TTL_SECONDS ?? 900);
  return Number.isFinite(sec) && sec > 0 ? sec : 900;
};
