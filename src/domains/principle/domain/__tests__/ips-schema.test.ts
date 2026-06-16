import { describe, expect, it } from 'vitest';
import {
  parseIpsDocument,
  safeParseIpsDocument,
  sumAllocationWeights,
} from '../ips-schema';

const validDoc = {
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

describe('ips-schema', () => {
  it('parses a valid IPS document', () => {
    const doc = parseIpsDocument(validDoc);
    expect(doc.schemaVersion).toBe('ips-v0.1');
    expect(doc.allocation.targets).toHaveLength(2);
  });

  it('rejects allocation sum != 100', () => {
    const result = safeParseIpsDocument({
      ...validDoc,
      allocation: {
        targets: [
          { assetClass: 'cash', weightPct: 30 },
          { assetClass: 'equity_kr', weightPct: 30 },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('requires customNote when loss action is custom_note', () => {
    const result = safeParseIpsDocument({
      ...validDoc,
      lossLimit: {
        maxDrawdownReviewPct: 10,
        action: 'custom_note',
      },
    });
    expect(result.success).toBe(false);
  });

  it('sumAllocationWeights matches targets', () => {
    expect(sumAllocationWeights(validDoc.allocation.targets)).toBe(100);
  });

  it('rejects preCommitment shorter than 20 chars', () => {
    const result = safeParseIpsDocument({
      ...validDoc,
      review: {
        cadence: 'monthly',
        preCommitment: { text: 'too short' },
      },
    });
    expect(result.success).toBe(false);
  });
});
