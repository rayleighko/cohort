/**
 * Macro indicator 30-day series endpoint — GET /api/macro/series/[code].
 *
 * Tier 0 (no auth). Returns the most-recent 30 daily observations plus the
 * latest value and the 7-day delta. Backs IndicatorCard sparklines (Day 8)
 * and IndicatorChart 30-day history (W3 expansion).
 *
 * ISR 1h matches /api/macro upstream.
 *
 * Allow-list of codes is enforced — any input outside the set returns 404
 * before we even touch the upstream fetcher. This prevents using the path
 * param as an open proxy for arbitrary ECOS/FRED series IDs.
 *
 * Strategic Decision 0 Option B: response carries values + dates only.
 * No allocation, timing, buy/sell directives or zone advice.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getEcosSeries, EcosFetchError } from '@/lib/macro/ecos';
import { getFredSeries, FredFetchError } from '@/lib/macro/fred';

export const runtime = 'nodejs';
export const revalidate = 3600;

type IndicatorSource = 'ecos' | 'fred';

interface SeriesMeta {
  source: IndicatorSource;
  fetcherId: string;
}

const SERIES_META: Record<string, SeriesMeta> = {
  KR_10Y: { source: 'ecos', fetcherId: 'KR_10Y' },
  USDKRW: { source: 'ecos', fetcherId: 'USDKRW' },
  DGS10: { source: 'fred', fetcherId: 'DGS10' },
  VIXCLS: { source: 'fred', fetcherId: 'VIXCLS' },
  DTWEXBGS: { source: 'fred', fetcherId: 'DTWEXBGS' },
};

const ALLOWED_CODES = Object.keys(SERIES_META);

interface SeriesObservation {
  date: string;
  value: number;
}

interface SeriesResponse {
  code: string;
  source: IndicatorSource;
  observations: SeriesObservation[];
  latest: number | null;
  delta_7d: number | null;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the UTC-midnight Date for the day N days before today. Normalizing
 * to midnight is required so that the 7-day delta comparator picks the
 * correctly-dated observation regardless of what hour the request fires.
 */
function dateNDaysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function noStoreOnError(payload: unknown, status: number): NextResponse {
  const res = NextResponse.json(payload, { status });
  res.headers.set('cache-control', 'no-store');
  return res;
}

/**
 * Picks the observation closest to a target offset (e.g. 7 days back). Series
 * observations from ECOS/FRED may have gaps for weekends/holidays, so we
 * search a small window around the target.
 *
 * Returns undefined when no observation falls within `maxDeltaDays` of the
 * target — this is the "data too stale to compare" signal that prevents
 * `latest - sevenBack.value` from collapsing to 0 (which would be
 * indistinguishable from "the market didn't move").
 */
function pickClosestToOffset(
  observations: SeriesObservation[],
  daysBack: number,
  maxDeltaDays = 3,
): SeriesObservation | undefined {
  if (observations.length === 0) return undefined;
  const target = dateNDaysAgo(daysBack);
  const targetMs = target.getTime();
  const maxDeltaMs = maxDeltaDays * 24 * 60 * 60 * 1000;
  let best: SeriesObservation | undefined;
  let bestDelta = Infinity;
  for (const obs of observations) {
    const ms = new Date(obs.date + 'T00:00:00Z').getTime();
    const delta = Math.abs(ms - targetMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = obs;
    }
  }
  return bestDelta <= maxDeltaMs ? best : undefined;
}

export async function GET(
  _request: NextRequest,
  context: { params: { code: string } },
): Promise<NextResponse> {
  const code = context.params.code;
  if (typeof code !== 'string' || !ALLOWED_CODES.includes(code)) {
    return noStoreOnError(
      { error: 'unknown_code', allowed: ALLOWED_CODES },
      404,
    );
  }

  const meta = SERIES_META[code];
  const endDate = toIsoDate(new Date());
  const startDate = toIsoDate(dateNDaysAgo(30));

  let raw: SeriesObservation[];
  try {
    raw =
      meta.source === 'ecos'
        ? await getEcosSeries(meta.fetcherId, { startDate, endDate })
        : await getFredSeries(meta.fetcherId, { startDate, endDate });
  } catch (err) {
    if (err instanceof EcosFetchError || err instanceof FredFetchError) {
      console.error(
        `[Cohort] series fetch failed for ${code}: ${err.message}`,
      );
      return noStoreOnError(
        {
          error: 'series_unavailable',
          code,
          retryHint: 'Try again in a few minutes.',
        },
        503,
      );
    }
    console.error(`[Cohort] series fetch unexpected error for ${code}`, err);
    return noStoreOnError(
      { error: 'series_unavailable', code },
      503,
    );
  }

  // ECOS/FRED helpers normally sort ascending; sort defensively in case the
  // upstream contract drifts (ECOS historically inconsistent), then cap to
  // the last 30 entries.
  const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
  const observations = sorted.slice(-30);
  const latest = observations.length > 0
    ? observations[observations.length - 1].value
    : null;
  const sevenBack = pickClosestToOffset(observations, 7);
  const delta_7d =
    latest !== null && sevenBack ? latest - sevenBack.value : null;

  const response: SeriesResponse = {
    code,
    source: meta.source,
    observations,
    latest,
    delta_7d,
  };
  return NextResponse.json(response);
}
