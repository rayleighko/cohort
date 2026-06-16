import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

function makeChain() {
  const chain = {
    select: mockSelect,
    eq: mockEq,
    is: mockIs,
    order: mockOrder,
    limit: mockLimit,
    insert: mockInsert,
    update: mockUpdate,
    maybeSingle: mockMaybeSingle,
    single: mockSingle,
  };
  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockIs.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);
  mockLimit.mockReturnValue(chain);
  mockInsert.mockReturnValue(chain);
  mockUpdate.mockReturnValue(chain);
  return chain;
}

let mockUser: { id: string } | null = { id: 'user-uuid-1' };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: vi.fn(() => makeChain()),
  })),
}));

import { GET, POST } from '../route';

const VALID_DOC = {
  schemaVersion: 'ips-v0.1' as const,
  horizon: { yearsBand: 'y5_10' as const },
  allocation: {
    targets: [
      { assetClass: 'bond_kr' as const, weightPct: 40 },
      { assetClass: 'equity_global' as const, weightPct: 60 },
    ],
  },
  lossLimit: {
    maxDrawdownReviewPct: 15,
    action: 'review_only' as const,
  },
  pace: { monthlyContributionBand: 'pct_5_10_income' as const },
  rebalance: { driftThresholdPct: 5, cadence: 'quarterly' as const },
  review: {
    cadence: 'monthly' as const,
    preCommitment: {
      text: '시장이 흔들릴 때는 본인이 정한 배분과 페이스를 우선 따른다.',
    },
  },
};

beforeEach(() => {
  mockUser = { id: 'user-uuid-1' };
  vi.clearAllMocks();
  makeChain();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/principle/ips', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUser = null;
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns null principle when no active row', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.principle).toBeNull();
  });

  it('returns active principle when document validates', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: 'ips-1',
        version: 1,
        document: VALID_DOC,
        acknowledged_at: '2026-06-11T00:00:00Z',
        created_at: '2026-06-11T00:00:00Z',
      },
      error: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.principle.id).toBe('ips-1');
    expect(body.principle.document.schemaVersion).toBe('ips-v0.1');
  });
});

describe('POST /api/principle/ips', () => {
  it('returns 401 when unauthenticated', async () => {
    mockUser = null;
    const res = await POST(
      new Request('http://localhost/api/principle/ips', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(VALID_DOC),
      }) as never,
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid document', async () => {
    const res = await POST(
      new Request('http://localhost/api/principle/ips', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bad: true }),
      }) as never,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_document');
  });

  it('returns 200 and saves first version', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'ips-new',
        version: 1,
        acknowledged_at: '2026-06-11T00:00:00Z',
        created_at: '2026-06-11T00:00:00Z',
      },
      error: null,
    });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq });

    const res = await POST(
      new Request('http://localhost/api/principle/ips', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(VALID_DOC),
      }) as never,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('ips-new');
    expect(body.version).toBe(1);
  });
});
