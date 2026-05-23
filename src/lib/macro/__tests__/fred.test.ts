import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  FredFetchError,
  __clearFredCacheForTests,
  getFredSeries,
} from '../fred';

const FRED_OK = {
  observations: [
    { date: '2026-05-21', value: '4.25' },
    { date: '2026-05-22', value: '4.30' },
    { date: '2026-05-23', value: '.' }, // FRED missing-value sentinel
  ],
};

beforeEach(() => {
  __clearFredCacheForTests();
  vi.stubEnv('FRED_API_KEY', 'test-fred-key');
  vi.stubEnv('FRED_CACHE_TTL_SECONDS', '3600');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('getFredSeries — success path', () => {
  it('parses observations, drops "." values, sorts ascending by date', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(FRED_OK), { status: 200 }),
    );
    const result = await getFredSeries('DGS10');
    expect(result).toEqual([
      { date: '2026-05-21', value: 4.25 },
      { date: '2026-05-22', value: 4.3 },
    ]);
  });

  it('builds URL with series_id, api_key, file_type, and date range', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(FRED_OK), { status: 200 }),
    );
    await getFredSeries('VIXCLS', {
      startDate: '2026-05-01',
      endDate: '2026-05-22',
    });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('series_id=VIXCLS');
    expect(url).toContain('api_key=test-fred-key');
    expect(url).toContain('file_type=json');
    expect(url).toContain('observation_start=2026-05-01');
    expect(url).toContain('observation_end=2026-05-22');
  });
});

describe('getFredSeries — caching', () => {
  it('returns cached result on second call within TTL', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation(async () =>
        new Response(JSON.stringify(FRED_OK), { status: 200 }),
      );
    await getFredSeries('DGS10', { startDate: '2026-05-01', endDate: '2026-05-22' });
    await getFredSeries('DGS10', { startDate: '2026-05-01', endDate: '2026-05-22' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('getFredSeries — retry', () => {
  it('retries on transient 5xx and succeeds on a later attempt', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(new Response('boom', { status: 502 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(FRED_OK), { status: 200 }),
      );
    vi.useFakeTimers();
    const promise = getFredSeries('DGS10');
    await vi.runAllTimersAsync();
    const result = await promise;
    vi.useRealTimers();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('throws FredFetchError after exhausting all retries', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('boom', { status: 500 }));
    vi.useFakeTimers();
    const promise = getFredSeries('DGS10');
    const rejection = expect(promise).rejects.toBeInstanceOf(FredFetchError);
    await vi.runAllTimersAsync();
    await rejection;
    vi.useRealTimers();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

describe('getFredSeries — input validation', () => {
  it('throws on unknown series ids (no network call)', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    await expect(getFredSeries('UNKNOWN')).rejects.toBeInstanceOf(
      FredFetchError,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws when FRED_API_KEY is missing', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('FRED_CACHE_TTL_SECONDS', '3600');
    await expect(getFredSeries('DGS10')).rejects.toThrow(/FRED_API_KEY/);
  });

  it('throws on FRED error envelope', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error_code: 400,
          error_message: 'Bad Request: invalid series_id',
        }),
        { status: 200 },
      ),
    );
    await expect(getFredSeries('DGS10')).rejects.toThrow(/FRED error/);
  });
});
