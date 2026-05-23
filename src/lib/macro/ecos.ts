/**
 * 한국은행 ECOS API client — server-only.
 *
 * Per 26-spec §W2 Day 1 indicator set + 24-seo Page 5 calibration source.
 * Day 6 scope: 2 score-contributing series (KR_10Y, USDKRW). Additional
 * display-only series (기준금리, KOSPI close) defer to W3.
 *
 * ECOS REST URL shape:
 *   /api/StatisticSearch/{key}/json/kr/{start}/{end}/{statCode}/{cycle}/{startDate}/{endDate}/{itemCode}
 * Series codes (statCode + itemCode) are reference values; if ECOS rejects
 * a series, the call throws and /api/macro degrades that indicator.
 */

export interface EcosObservation {
  date: string; // YYYY-MM-DD
  value: number;
}

export class EcosFetchError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'EcosFetchError';
  }
}

interface EcosSeriesSpec {
  statCode: string;
  itemCode: string;
  cycle: 'D' | 'M' | 'Q' | 'A';
}

const ECOS_SERIES: Record<string, EcosSeriesSpec> = {
  KR_10Y: { statCode: '817Y002', itemCode: '010210000', cycle: 'D' }, // 국고채(10년)
  USDKRW: { statCode: '731Y001', itemCode: '0000001', cycle: 'D' }, // 원/달러(매매기준율)
};

const ECOS_BASE = 'https://ecos.bok.or.kr/api/StatisticSearch';
const MAX_CONCURRENT = 3;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];

function getCacheTtlMs(): number {
  const sec = Number(process.env.ECOS_CACHE_TTL_SECONDS ?? 3600);
  return (Number.isFinite(sec) && sec > 0 ? sec : 3600) * 1000;
}

interface CacheEntry {
  data: EcosObservation[];
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

function toEcosDate(d: string): string {
  return d.replace(/-/g, '');
}

function fromEcosDate(d: string): string {
  if (d.length !== 8) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function defaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

interface EcosRow {
  TIME: string;
  DATA_VALUE: string;
}

interface EcosOkResponse {
  StatisticSearch?: {
    list_total_count?: number;
    row?: EcosRow[];
  };
}

interface EcosErrResponse {
  RESULT?: { CODE: string; MESSAGE: string };
}

function parseEcosBody(body: unknown, seriesCode: string): EcosObservation[] {
  const err = body as EcosErrResponse;
  if (err.RESULT?.CODE && err.RESULT.CODE !== 'INFO-000') {
    throw new EcosFetchError(
      `ECOS error on ${seriesCode}: ${err.RESULT.CODE} ${err.RESULT.MESSAGE}`,
    );
  }
  const ok = body as EcosOkResponse;
  const rows = ok.StatisticSearch?.row ?? [];
  return rows
    .map((r) => ({
      date: fromEcosDate(r.TIME),
      value: Number(r.DATA_VALUE),
    }))
    .filter((o) => Number.isFinite(o.value))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

async function fetchOnce(
  seriesCode: string,
  spec: EcosSeriesSpec,
  apiKey: string,
  startDate: string,
  endDate: string,
): Promise<EcosObservation[]> {
  const url =
    `${ECOS_BASE}/${apiKey}/json/kr/1/1000/` +
    `${spec.statCode}/${spec.cycle}/${toEcosDate(startDate)}/${toEcosDate(endDate)}/${spec.itemCode}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new EcosFetchError(`ECOS HTTP ${res.status} on ${seriesCode}`);
  }
  const body = await res.json();
  return parseEcosBody(body, seriesCode);
}

export async function getEcosSeries(
  seriesCode: string,
  opts: { startDate?: string; endDate?: string } = {},
): Promise<EcosObservation[]> {
  const spec = ECOS_SERIES[seriesCode];
  if (!spec) {
    throw new EcosFetchError(`Unknown ECOS series code: ${seriesCode}`);
  }
  const apiKey = process.env.ECOS_API_KEY;
  if (!apiKey) {
    throw new EcosFetchError('ECOS_API_KEY is not set');
  }

  const { start, end } = defaultDateRange();
  const startDate = opts.startDate ?? start;
  const endDate = opts.endDate ?? end;
  const cacheKey = `${seriesCode}:${startDate}:${endDate}`;

  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_BACKOFF_MS.length; attempt++) {
    try {
      const data = await withSemaphore(() =>
        fetchOnce(seriesCode, spec, apiKey, startDate, endDate),
      );
      cache.set(cacheKey, { data, expiresAt: Date.now() + getCacheTtlMs() });
      return data;
    } catch (err) {
      lastError = err;
      const transient =
        !(err instanceof EcosFetchError) ||
        /HTTP 5\d\d/.test(err.message) ||
        /fetch failed/i.test(err.message);
      // Non-transient errors (e.g., ECOS RESULT.CODE envelope) propagate
      // immediately with their original message — don't wrap.
      if (!transient) throw err;
      if (attempt === RETRY_BACKOFF_MS.length - 1) break;
      await sleep(RETRY_BACKOFF_MS[attempt]);
    }
  }
  throw new EcosFetchError(
    `ECOS fetch failed for ${seriesCode} after ${RETRY_BACKOFF_MS.length} attempts`,
    lastError,
  );
}

/** Test-only: drop the in-memory cache so a test starts fresh. */
export function __clearEcosCacheForTests(): void {
  cache.clear();
}
