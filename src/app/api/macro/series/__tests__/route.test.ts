import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/macro/ecos', async () => {
  const actual = await vi.importActual<typeof import('@/lib/macro/ecos')>(
    '@/lib/macro/ecos',
  );
  return {
    ...actual,
    getEcosSeries: vi.fn(),
  };
});

vi.mock('@/lib/macro/fred', async () => {
  const actual = await vi.importActual<typeof import('@/lib/macro/fred')>(
    '@/lib/macro/fred',
  );
  return {
    ...actual,
    getFredSeries: vi.fn(),
  };
});

import { GET } from '../[code]/route';
import { getEcosSeries, EcosFetchError } from '@/lib/macro/ecos';
import { getFredSeries, FredFetchError } from '@/lib/macro/fred';

const mockedEcos = vi.mocked(getEcosSeries);
const mockedFred = vi.mocked(getFredSeries);

// Builds a synthetic 30-day daily series ending today, with a known
// 7-day delta — used by delta_7d assertions below.
function makeSeries(latest: number, deltaSevenAgo: number) {
  const out: Array<{ date: string; value: number }> = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (i === 0) out.push({ date: iso, value: latest });
    else if (i === 7) out.push({ date: iso, value: latest - deltaSevenAgo });
    else out.push({ date: iso, value: latest - (i % 5) });
  }
  return out;
}

afterEach(() => {
  vi.restoreAllMocks();
  mockedEcos.mockReset();
  mockedFred.mockReset();
});

const makeRequest = () =>
  new Request('http://localhost/api/macro/series/x') as never;

describe('GET /api/macro/series/[code]', () => {
  it('returns 200 with VIXCLS series from FRED + latest + delta_7d', async () => {
    mockedFred.mockResolvedValueOnce(makeSeries(17.5, 2.5));

    const res = await GET(makeRequest(), {
      params: { code: 'VIXCLS' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toBe('VIXCLS');
    expect(body.source).toBe('fred');
    expect(body.observations).toHaveLength(30);
    expect(body.latest).toBe(17.5);
    expect(body.latest_date).toBeTruthy();
    expect(body.delta_7d).toBeCloseTo(2.5, 5);
    expect(mockedFred).toHaveBeenCalledWith(
      'VIXCLS',
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      }),
    );
  });

  it('returns 200 with USDKRW series from ECOS', async () => {
    mockedEcos.mockResolvedValueOnce(makeSeries(1342.5, -10.0));

    const res = await GET(makeRequest(), {
      params: { code: 'USDKRW' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toBe('USDKRW');
    expect(body.source).toBe('ecos');
    expect(body.latest).toBe(1342.5);
    expect(body.delta_7d).toBeCloseTo(-10.0, 5);
  });

  it('returns 404 for an unknown code with allowed list', async () => {
    const res = await GET(makeRequest(), {
      params: { code: 'BTCUSD' },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('unknown_code');
    expect(body.allowed).toContain('VIXCLS');
    expect(body.allowed).toContain('USDKRW');
    expect(mockedFred).not.toHaveBeenCalled();
    expect(mockedEcos).not.toHaveBeenCalled();
  });

  it('returns 404 for path traversal attempt', async () => {
    const res = await GET(makeRequest(), {
      params: { code: '../../etc/passwd' },
    });
    expect(res.status).toBe(404);
  });

  it('returns 503 when ECOS throws EcosFetchError', async () => {
    mockedEcos.mockRejectedValueOnce(new EcosFetchError('ECOS HTTP 503'));

    const res = await GET(makeRequest(), {
      params: { code: 'KR_10Y' },
    });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('series_unavailable');
    expect(body.code).toBe('KR_10Y');
    expect(body.retryHint).toBeTruthy();
  });

  it('returns 503 when FRED throws FredFetchError', async () => {
    mockedFred.mockRejectedValueOnce(new FredFetchError('FRED 429 rate limit'));

    const res = await GET(makeRequest(), {
      params: { code: 'DGS10' },
    });

    expect(res.status).toBe(503);
  });

  it('caps observations to last 30 entries (defensive against upstream over-return)', async () => {
    // Simulate a 60-entry response — route should slice to last 30.
    const series: Array<{ date: string; value: number }> = [];
    for (let i = 60; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      series.push({ date: d.toISOString().slice(0, 10), value: 100 + i });
    }
    mockedFred.mockResolvedValueOnce(series);

    const res = await GET(makeRequest(), {
      params: { code: 'DTWEXBGS' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.observations).toHaveLength(30);
  });

  it('returns latest=null + delta_7d=null when upstream returns empty series', async () => {
    mockedFred.mockResolvedValueOnce([]);

    const res = await GET(makeRequest(), {
      params: { code: 'VIXCLS' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.latest).toBeNull();
    expect(body.delta_7d).toBeNull();
    expect(body.observations).toEqual([]);
  });

  it('sets cache-control: no-store on 404 + 503 paths (no caching of error states)', async () => {
    const r404 = await GET(makeRequest(), {
      params: { code: 'UNKNOWN' },
    });
    expect(r404.headers.get('cache-control')).toBe('no-store');

    mockedEcos.mockRejectedValueOnce(new EcosFetchError('boom'));
    const r503 = await GET(makeRequest(), {
      params: { code: 'KR_10Y' },
    });
    expect(r503.headers.get('cache-control')).toBe('no-store');
  });

  it('returns delta_7d=null when series only has a today observation (no comparator within 3d window)', async () => {
    // Single-observation case: today only. The 7-day comparator's
    // maxDeltaDays=3 window rejects today (~7d off target), so delta_7d
    // becomes null — distinguishing "no comparator" from "market flat".
    mockedFred.mockResolvedValueOnce([
      { date: new Date().toISOString().slice(0, 10), value: 100 },
    ]);

    const res = await GET(makeRequest(), {
      params: { code: 'VIXCLS' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.latest).toBe(100);
    expect(body.delta_7d).toBeNull();
  });

  it('returns delta_7d=null when nearest observation is > 3 days from 7-day target (stale upstream guard)', async () => {
    // Upstream returns only one recent obs (3 days ago) — too far from
    // the 7-day-back target, so delta_7d collapses to null rather than
    // misleading "0 movement" copy.
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setUTCDate(today.getUTCDate() - 3);
    mockedFred.mockResolvedValueOnce([
      { date: threeDaysAgo.toISOString().slice(0, 10), value: 95 },
      { date: today.toISOString().slice(0, 10), value: 100 },
    ]);

    const res = await GET(makeRequest(), {
      params: { code: 'VIXCLS' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.latest).toBe(100);
    expect(body.delta_7d).toBeNull();
  });

  it('sorts non-ascending upstream observations before latest/delta computation (drift guard)', async () => {
    // Simulate descending-order upstream — route must sort, not trust order.
    const dates: Array<{ date: string; value: number }> = [];
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      dates.push({ date: d.toISOString().slice(0, 10), value: 100 - i });
    }
    // dates is now descending (today first); pass it in unsorted.
    mockedFred.mockResolvedValueOnce(dates);

    const res = await GET(makeRequest(), {
      params: { code: 'DTWEXBGS' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    // After internal sort, latest must be today's value (100), not the
    // descending head trailing item (70 = i=30).
    expect(body.latest).toBe(100);
    // 7-day-back value is 93, so delta is +7.
    expect(body.delta_7d).toBeCloseTo(7, 5);
  });
});
