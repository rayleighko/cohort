import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/macro/snapshot', () => ({
  getMacroSnapshot: vi.fn(),
}));

import { GET } from '../route';
import { getMacroSnapshot } from '@/lib/macro/snapshot';

const mockedSnapshot = vi.mocked(getMacroSnapshot);

afterEach(() => {
  vi.restoreAllMocks();
  mockedSnapshot.mockReset();
});

describe('GET /api/macro', () => {
  it('returns 200 with composite when snapshot succeeds', async () => {
    mockedSnapshot.mockResolvedValueOnce({
      composite: {
        score: 0.77,
        zone: 'neutral',
        keyDriver: { source: 'fred', code: 'VIXCLS', contribution: 1.09 },
        indicators: [],
        computedAt: '2026-05-23T01:00:00.000Z',
        asOfDate: '2026-05-22',
      },
      fetchedAt: '2026-05-23T01:00:00.000Z',
      fetchErrors: [],
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.composite.zone).toBe('neutral');
    expect(body.fetchedAt).toBe('2026-05-23T01:00:00.000Z');
  });

  it('returns 200 with degraded composite when some fetches fail', async () => {
    mockedSnapshot.mockResolvedValueOnce({
      composite: {
        score: -1.5,
        zone: 'neutral',
        keyDriver: { source: 'ecos', code: 'USDKRW', contribution: -0.7 },
        indicators: [],
        computedAt: '2026-05-23T01:00:00.000Z',
        asOfDate: '2026-05-22',
        degraded: true,
        missingIndicators: ['fred:DTWEXBGS'],
      },
      fetchedAt: '2026-05-23T01:00:00.000Z',
      fetchErrors: [
        { source: 'fred', code: 'DTWEXBGS', message: 'FRED HTTP 503' },
      ],
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.composite.degraded).toBe(true);
    expect(body.composite.missingIndicators).toEqual(['fred:DTWEXBGS']);
    expect(body.fetchErrors).toHaveLength(1);
  });

  it('returns 503 with retry hint when snapshot throws (all indicators missing)', async () => {
    mockedSnapshot.mockRejectedValueOnce(
      new Error('No macro indicators available — cannot compute composite'),
    );
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('macro_unavailable');
    expect(body.retryHint).toBeTruthy();
  });
});
