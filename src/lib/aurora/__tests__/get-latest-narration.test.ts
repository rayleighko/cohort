import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Row = {
  text: string;
  category: string;
  composite_snapshot: unknown;
  created_at: string;
};

interface SupabaseResult {
  data: Row | null;
  error: { message: string } | null;
}

const chain = {
  // these are reset per test in beforeEach
  result: { data: null as Row | null, error: null as { message: string } | null } as SupabaseResult,
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
  chain.result = { data: null, error: null };
  chain.throwOnCall = null;

  mockedCreateAdminClient.mockClear();
  mockedFrom.mockReset();
  mockedFrom.mockImplementation((_table: string) => {
    if (chain.throwOnCall) throw chain.throwOnCall;
    const selfReturning = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => chain.result),
    };
    return selfReturning;
  });

  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLatestNarration', () => {
  it('returns null when the table is empty (maybeSingle resolves data=null)', async () => {
    setSupabaseResult({ data: null, error: null });
    const result = await getLatestNarration();
    expect(result).toBeNull();
    expect(mockedCreateAdminClient).toHaveBeenCalledOnce();
    expect(mockedFrom).toHaveBeenCalledWith('aurora_narration_log');
  });

  it('returns the row with isArchive=true and zone from composite_snapshot', async () => {
    setSupabaseResult({
      data: {
        text: '오늘의 cohort. 한국 macro composite는 +2.3 (neutral-dovish).',
        category: 'morning_brief',
        composite_snapshot: { zone: 'neutral-dovish' },
        created_at: '2026-05-27T01:00:00.000Z',
      },
      error: null,
    });
    const result = await getLatestNarration();
    expect(result).not.toBeNull();
    expect(result?.text).toBe(
      '오늘의 cohort. 한국 macro composite는 +2.3 (neutral-dovish).',
    );
    expect(result?.category).toBe('morning_brief');
    expect(result?.zone).toBe('neutral-dovish');
    expect(result?.createdAt).toBe('2026-05-27T01:00:00.000Z');
    expect(result?.isArchive).toBe(true);
  });

  it('defaults zone to "neutral" when composite_snapshot lacks a zone field', async () => {
    setSupabaseResult({
      data: {
        text: 'fallback narration',
        category: 'morning_brief',
        composite_snapshot: { score: 0.5 },
        created_at: '2026-05-26T01:00:00.000Z',
      },
      error: null,
    });
    const result = await getLatestNarration();
    expect(result?.zone).toBe('neutral');
  });

  it('defaults zone to "neutral" when composite_snapshot is null', async () => {
    setSupabaseResult({
      data: {
        text: 'narration without snapshot',
        category: 'morning_brief',
        composite_snapshot: null,
        created_at: '2026-05-26T01:00:00.000Z',
      },
      error: null,
    });
    const result = await getLatestNarration();
    expect(result?.zone).toBe('neutral');
  });

  it('applies category=morning_brief + triggered=false + order DESC + limit 1 chain', async () => {
    setSupabaseResult({ data: null, error: null });
    await getLatestNarration();
    // Capture the returned builder used during the call
    const builder = mockedFrom.mock.results[0]?.value as {
      select: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      maybeSingle: ReturnType<typeof vi.fn>;
    };
    expect(builder.select).toHaveBeenCalledWith(
      'text, category, composite_snapshot, created_at',
    );
    expect(builder.eq).toHaveBeenCalledWith('category', 'morning_brief');
    expect(builder.eq).toHaveBeenCalledWith('triggered', false);
    expect(builder.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(builder.limit).toHaveBeenCalledWith(1);
    expect(builder.maybeSingle).toHaveBeenCalledOnce();
  });

  it('returns null and logs when Supabase reports an error', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    setSupabaseResult({ data: null, error: { message: 'rls denied' } });
    const result = await getLatestNarration();
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns null and logs when the admin client throws (env not set, network etc.)', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    setSupabaseThrow(new Error('admin_client_missing_env'));
    const result = await getLatestNarration();
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});
