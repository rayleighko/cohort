import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Row = {
  text: string;
  category: string;
  composite_snapshot: unknown;
  created_at: string;
  triggered: boolean;
};

interface SupabaseResult {
  data: Row[] | null;
  error: { message: string } | null;
}

const chain = {
  result: { data: [] as Row[], error: null as { message: string } | null } as SupabaseResult,
  throwOnCall: null as Error | null,
};

const mockedFrom = vi.fn();
const mockedCreateAdminClient = vi.fn(() => ({ from: mockedFrom }));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockedCreateAdminClient(),
}));

import { getLatestNarration } from '../get-latest-narration';

function setSupabaseResult(result: SupabaseResult) {
  chain.result = result;
  chain.throwOnCall = null;
}

function setSupabaseThrow(err: Error) {
  chain.throwOnCall = err;
}

beforeEach(() => {
  chain.result = { data: [], error: null };
  chain.throwOnCall = null;

  mockedCreateAdminClient.mockClear();
  mockedFrom.mockReset();
  mockedFrom.mockImplementation((_table: string) => {
    if (chain.throwOnCall) throw chain.throwOnCall;
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(async () => chain.result),
    };
  });

  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLatestNarration', () => {
  it('returns null when the table is empty', async () => {
    setSupabaseResult({ data: [], error: null });
    const result = await getLatestNarration();
    expect(result).toBeNull();
    expect(mockedCreateAdminClient).toHaveBeenCalledOnce();
    expect(mockedFrom).toHaveBeenCalledWith('aurora_narration_log');
  });

  it('returns the latest row when no preferredAsOfDate is given', async () => {
    setSupabaseResult({
      data: [
        {
          text: '오늘의 cohort. 한국 macro composite는 +2.3 (neutral-dovish).',
          category: 'morning_brief',
          composite_snapshot: { zone: 'neutral-dovish', asOfDate: '2026-05-27' },
          created_at: '2026-05-27T01:00:00.000Z',
          triggered: false,
        },
      ],
      error: null,
    });
    const result = await getLatestNarration();
    expect(result?.text).toBe(
      '오늘의 cohort. 한국 macro composite는 +2.3 (neutral-dovish).',
    );
    expect(result?.asOfDate).toBe('2026-05-27');
    expect(result?.isArchive).toBe(true);
  });

  it('returns the row matching preferredAsOfDate', async () => {
    setSupabaseResult({
      data: [
        {
          text: 'newer but wrong day',
          category: 'morning_brief',
          composite_snapshot: { zone: 'neutral', asOfDate: '2026-06-11' },
          created_at: '2026-06-11T01:00:00.000Z',
          triggered: false,
        },
        {
          text: 'matched day brief',
          category: 'morning_brief',
          composite_snapshot: { zone: 'neutral-dovish', asOfDate: '2026-06-10' },
          created_at: '2026-06-10T01:00:00.000Z',
          triggered: false,
        },
      ],
      error: null,
    });
    const result = await getLatestNarration('2026-06-10');
    expect(result?.text).toBe('matched day brief');
    expect(result?.asOfDate).toBe('2026-06-10');
  });

  it('returns null when preferredAsOfDate has no matching row (no stale cross-day archive)', async () => {
    setSupabaseResult({
      data: [
        {
          text: 'old brief',
          category: 'morning_brief',
          composite_snapshot: { zone: 'neutral', asOfDate: '2026-05-01' },
          created_at: '2026-05-01T01:00:00.000Z',
          triggered: false,
        },
      ],
      error: null,
    });
    const result = await getLatestNarration('2026-06-11');
    expect(result).toBeNull();
  });

  it('defaults zone to "neutral" when composite_snapshot lacks a zone field', async () => {
    setSupabaseResult({
      data: [
        {
          text: 'fallback narration',
          category: 'morning_brief',
          composite_snapshot: { score: 0.5, asOfDate: '2026-05-26' },
          created_at: '2026-05-26T01:00:00.000Z',
          triggered: false,
        },
      ],
      error: null,
    });
    const result = await getLatestNarration('2026-05-26');
    expect(result?.zone).toBe('neutral');
  });

  it('queries recent morning brief rows (limit 30)', async () => {
    setSupabaseResult({ data: [], error: null });
    await getLatestNarration();
    const builder = mockedFrom.mock.results[0]?.value as {
      limit: ReturnType<typeof vi.fn>;
    };
    expect(builder.limit).toHaveBeenCalledWith(30);
  });

  it('returns null and logs when Supabase reports an error', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    setSupabaseResult({ data: null, error: { message: 'rls denied' } });
    const result = await getLatestNarration();
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns null and logs when the admin client throws', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    setSupabaseThrow(new Error('admin_client_missing_env'));
    const result = await getLatestNarration();
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});
