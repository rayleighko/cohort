/**
 * St. Louis Fed FRED API client — server-only.
 *
 * Per 26-spec §W2 Day 1. Day 6 scope: 3 score-contributing series
 * (DGS10, VIXCLS, DTWEXBGS). CPI / PCE deferred to W3 — FRED series IDs
 * for those are not yet vault-pinned (26-spec lists semantic names only).
 *
 * FRED REST URL shape:
 *   https://api.stlouisfed.org/fred/series/observations
 *     ?series_id=...&api_key=...&file_type=json
 *     &observation_start=YYYY-MM-DD&observation_end=YYYY-MM-DD
 */

export interface FredObservation {
  date: string; // YYYY-MM-DD
  value: number;
}

export class FredFetchError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'FredFetchError';
  }
}

/** Allow-list of FRED series IDs Day 6 will fetch. */
const FRED_SERIES = new Set<string>(['DGS10', 'VIXCLS', 'DTWEXBGS']);

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const MAX_CONCURRENT = 3;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];

function getCacheTtlMs(): number {
  const sec = Number(process.env.FRED_CACHE_TTL_SECONDS ?? 3600);
  return (Number.isFinite(sec) && sec > 0 ? sec : 3600) * 1000;
}

interface CacheEntry {
  data: FredObservation[];
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();

let activeRequests = 0;
const waitingForSlot: Array<() => void> = [];

async function withSemaphore<T>(fn: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waitingForSlot.push(resolve));
  }
  activeRequests++;
  try {
    return await fn();
  } finally {
    activeRequests--;
    const next = waitingForSlot.shift();
    if (next) next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

interface FredObservationRaw {
  date: string;
  value: string; // FRED returns "." for missing values
}

interface FredResponse {
  observations?: FredObservationRaw[];
  error_code?: number;
  error_message?: string;
}

function parseFredBody(body: unknown, seriesId: string): FredObservation[] {
  const r = body as FredResponse;
  if (typeof r.error_code === 'number') {
    throw new FredFetchError(
      `FRED error on ${seriesId}: ${r.error_code} ${r.error_message ?? ''}`,
    );
  }
  const rows = r.observations ?? [];
  return rows
    .map((o) => ({ date: o.date, value: Number(o.value) }))
    .filter((o) => Number.isFinite(o.value))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

async function fetchOnce(
  seriesId: string,
  apiKey: string,
  startDate: string,
  endDate: string,
): Promise<FredObservation[]> {
  const url =
    `${FRED_BASE}?series_id=${encodeURIComponent(seriesId)}` +
    `&api_key=${encodeURIComponent(apiKey)}` +
    `&file_type=json` +
    `&observation_start=${startDate}` +
    `&observation_end=${endDate}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new FredFetchError(`FRED HTTP ${res.status} on ${seriesId}`);
  }
  const body = await res.json();
  return parseFredBody(body, seriesId);
}

export async function getFredSeries(
  seriesId: string,
  opts: { startDate?: string; endDate?: string } = {},
): Promise<FredObservation[]> {
  if (!FRED_SERIES.has(seriesId)) {
    throw new FredFetchError(`Unknown FRED series id: ${seriesId}`);
  }
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new FredFetchError('FRED_API_KEY is not set');
  }

  const { start, end } = defaultDateRange();
  const startDate = opts.startDate ?? start;
  const endDate = opts.endDate ?? end;
  const cacheKey = `${seriesId}:${startDate}:${endDate}`;

  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_BACKOFF_MS.length; attempt++) {
    try {
      const data = await withSemaphore(() =>
        fetchOnce(seriesId, apiKey, startDate, endDate),
      );
      cache.set(cacheKey, { data, expiresAt: Date.now() + getCacheTtlMs() });
      return data;
    } catch (err) {
      lastError = err;
      const transient =
        !(err instanceof FredFetchError) ||
        /HTTP 5\d\d/.test(err.message) ||
        /fetch failed/i.test(err.message);
      // Non-transient errors (e.g., FRED 4xx via error envelope) propagate
      // immediately with their original message — don't wrap.
      if (!transient) throw err;
      if (attempt === RETRY_BACKOFF_MS.length - 1) break;
      await sleep(RETRY_BACKOFF_MS[attempt]);
    }
  }
  throw new FredFetchError(
    `FRED fetch failed for ${seriesId} after ${RETRY_BACKOFF_MS.length} attempts`,
    lastError,
  );
}

/** Test-only: drop the in-memory cache so a test starts fresh. */
export function __clearFredCacheForTests(): void {
  cache.clear();
}
