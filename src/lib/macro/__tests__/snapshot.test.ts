import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../ecos', () => ({
  getEcosSeries: vi.fn(),
  EcosFetchError: class extends Error {
    name = 'EcosFetchError';
  },
}));
vi.mock('../fred', () => ({
  getFredSeries: vi.fn(),
  FredFetchError: class extends Error {
    name = 'FredFetchError';
  },
}));

import { getMacroSnapshot } from '../snapshot';
import { EcosFetchError, getEcosSeries } from '../ecos';
import { FredFetchError, getFredSeries } from '../fred';

const mockedEcos = vi.mocked(getEcosSeries);
const mockedFred = vi.mocked(getFredSeries);

const DATE = '2026-05-22';

beforeEach(() => {
  mockedEcos.mockReset();
  mockedFred.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getMacroSnapshot', () => {
  it('returns a composite when all required series fetch successfully', async () => {
    mockedEcos.mockImplementation(async (code) => {
      const value = code === 'KR_10Y' ? 3.25 : 1365;
      return [{ date: DATE, value }];
    });
    mockedFred.mockImplementation(async (id) => {
      const value =
        id === 'DGS10' ? 4.25 : id === 'VIXCLS' ? 16.5 : 103;
      return [{ date: DATE, value }];
    });

    const snap = await getMacroSnapshot();
    expect(snap.composite.indicators).toHaveLength(4);
    expect(snap.composite.degraded).toBeUndefined();
    expect(snap.fetchErrors).toEqual([]);
    expect(snap.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('captures per-series failures and degrades the composite', async () => {
    mockedEcos.mockImplementation(async (code) => {
      if (code === 'KR_10Y') return [{ date: DATE, value: 3.25 }];
      throw new EcosFetchError('ECOS HTTP 503 on USDKRW');
    });
    mockedFred.mockImplementation(async (id) => {
      if (id === 'DTWEXBGS')
        throw new FredFetchError('FRED HTTP 503 on DTWEXBGS');
      const value = id === 'DGS10' ? 4.25 : 16.5;
      return [{ date: DATE, value }];
    });

    const snap = await getMacroSnapshot();
    expect(snap.composite.degraded).toBe(true);
    expect(snap.composite.missingIndicators).toContain('ecos:USDKRW');
    expect(snap.composite.missingIndicators).toContain('fred:DTWEXBGS');
    expect(snap.fetchErrors.map((e) => e.code).sort()).toEqual([
      'DTWEXBGS',
      'USDKRW',
    ]);
  });

  it('throws when all required series fail (no indicators to compute)', async () => {
    mockedEcos.mockRejectedValue(new EcosFetchError('ecos down'));
    mockedFred.mockRejectedValue(new FredFetchError('fred down'));
    await expect(getMacroSnapshot()).rejects.toThrow(
      /No macro indicators available/,
    );
  });
});
