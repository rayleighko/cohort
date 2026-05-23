import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  EcosFetchError,
  __clearEcosCacheForTests,
  getEcosSeries,
} from '../ecos';

const ECOS_OK = {
  StatisticSearch: {
    list_total_count: 2,
    row: [
      { TIME: '20260521', DATA_VALUE: '3.25' },
      { TIME: '20260522', DATA_VALUE: '3.30' },
    ],
  },
};

beforeEach(() => {
  __clearEcosCacheForTests();
  vi.stubEnv('ECOS_API_KEY', 'test-ecos-key');
  vi.stubEnv('ECOS_CACHE_TTL_SECONDS', '3600');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('getEcosSeries — success path', () => {
  it('parses ECOS rows into sorted EcosObservation[]', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(ECOS_OK), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const result = await getEcosSeries('KR_10Y');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { date: '2026-05-21', value: 3.25 },
      { date: '2026-05-22', value: 3.3 },
    ]);
  });

  it('builds the URL with statCode, cycle, and itemCode in the right slots', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(ECOS_OK), { status: 200 }),
    );
    await getEcosSeries('USDKRW', { startDate: '2026-05-01', endDate: '2026-05-22' });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/731Y001/'); // USDKRW statCode
    expect(url).toContain('/D/'); // daily cycle
    expect(url).toContain('/20260501/20260522/');
    expect(url).toContain('/0000001'); // USDKRW itemCode
    expect(url).toContain('test-ecos-key');
  });
});

describe('getEcosSeries — caching', () => {
  it('returns the cached result on the second call within TTL', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation(async () =>
        new Response(JSON.stringify(ECOS_OK), { status: 200 }),
      );
    await getEcosSeries('KR_10Y', { startDate: '2026-05-01', endDate: '2026-05-22' });
    await getEcosSeries('KR_10Y', { startDate: '2026-05-01', endDate: '2026-05-22' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not share cache entries across different date ranges', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation(async () =>
        new Response(JSON.stringify(ECOS_OK), { status: 200 }),
      );
    await getEcosSeries('KR_10Y', { startDate: '2026-05-01', endDate: '2026-05-15' });
    await getEcosSeries('KR_10Y', { startDate: '2026-05-16', endDate: '2026-05-22' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe('getEcosSeries — retry', () => {
  it('retries on transient 5xx and succeeds on a later attempt', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(new Response('boom', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(ECOS_OK), { status: 200 }),
      );
    vi.useFakeTimers();
    const promise = getEcosSeries('KR_10Y');
    await vi.runAllTimersAsync();
    const result = await promise;
    vi.useRealTimers();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('throws EcosFetchError after exhausting all retries', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('boom', { status: 503 }));
    vi.useFakeTimers();
    const promise = getEcosSeries('KR_10Y');
    const rejection = expect(promise).rejects.toBeInstanceOf(EcosFetchError);
    await vi.runAllTimersAsync();
    await rejection;
    vi.useRealTimers();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

describe('getEcosSeries — input validation', () => {
  it('throws on unknown series codes (no network call)', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    await expect(getEcosSeries('UNKNOWN_SERIES')).rejects.toBeInstanceOf(
      EcosFetchError,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws when ECOS_API_KEY is missing', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('ECOS_CACHE_TTL_SECONDS', '3600');
    await expect(getEcosSeries('KR_10Y')).rejects.toThrow(/ECOS_API_KEY/);
  });

  it('throws on ECOS error envelope (RESULT.CODE != INFO-000)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          RESULT: { CODE: 'INFO-200', MESSAGE: 'No data' },
        }),
        { status: 200 },
      ),
    );
    await expect(getEcosSeries('KR_10Y')).rejects.toThrow(/INFO-200/);
  });
});
