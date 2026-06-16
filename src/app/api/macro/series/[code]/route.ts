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
import { kstDaysAgoIso, kstTodayIso } from '@/lib/macro/kst-dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  /** YYYY-MM-DD of the latest observation in `observations`. */
  latest_date: string | null;
  /** YYYY-MM-DD used as the 7-day-ago comparator (within ±3d window). */
  delta_reference_date: string | null;
  delta_7d: number | null;
  /** Prior business-day comparator (~1 calendar day back, ±3d window). */
  previous_date: string | null;
  previous_value: number | null;
  delta_1d: number | null;
  /** Number of calendar days requested (7 | 30 | 90). */
  range_days: number;
}

function parseRangeDays(request: NextRequest): number {
  const raw = new URL(request.url).searchParams.get('days');
  if (raw === '7') return 7;
  if (raw === '90') return 90;
  return 30;
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
  const target = kstDaysAgoIso(daysBack);
  const targetMs = new Date(`${target}T00:00:00Z`).getTime();
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
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await context.params;
  if (typeof code !== 'string' || !ALLOWED_CODES.includes(code)) {
    return noStoreOnError(
      { error: 'unknown_code', allowed: ALLOWED_CODES },
      404,
    );
  }

  const rangeDays = parseRangeDays(request);
  const meta = SERIES_META[code];
  const endDate = kstTodayIso();
  const startDate = kstDaysAgoIso(rangeDays);

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
  const observations = sorted.slice(-rangeDays);
  const latestObs =
    observations.length > 0 ? observations[observations.length - 1] : undefined;
  const latest = latestObs?.value ?? null;
  const sevenBack = pickClosestToOffset(observations, 7);
  const oneBack = pickClosestToOffset(observations, 1);
  const delta_7d =
    latest !== null && sevenBack ? latest - sevenBack.value : null;
  const delta_1d =
    latest !== null && oneBack ? latest - oneBack.value : null;

  const response: SeriesResponse = {
    code,
    source: meta.source,
    observations,
    latest,
    latest_date: latestObs?.date ?? null,
    delta_reference_date: sevenBack?.date ?? null,
    delta_7d,
    previous_date: oneBack?.date ?? null,
    previous_value: oneBack?.value ?? null,
    delta_1d,
    range_days: rangeDays,
  };
  return NextResponse.json(response);
}
