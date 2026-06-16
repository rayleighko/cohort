import { describe, expect, it } from 'vitest';
import { IPS_SCHEMA_VERSION } from '@/domains/principle/domain/ips-schema';
import { summarizeIpsDocument } from '@/lib/companion/ips-summary';
import { buildCompanionResponse } from '@/lib/companion/responses';

const SAMPLE_DOC = {
  schemaVersion: IPS_SCHEMA_VERSION,
  horizon: { yearsBand: 'y5_10' as const },
  allocation: {
    targets: [
      { assetClass: 'equity_global' as const, weightPct: 60 },
      { assetClass: 'bond_kr' as const, weightPct: 40 },
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
      text: '흔들릴 때는 plan만 보고 새 매매는 24시간 미룬다.',
    },
  },
};

describe('summarizeIpsDocument', () => {
  it('summarizes valid IPS', () => {
    const s = summarizeIpsDocument(SAMPLE_DOC, 1);
    expect(s.hasIps).toBe(true);
    expect(s.horizonLabel).toContain('5–10');
    expect(s.allocationLine).toContain('60%');
    expect(s.drawdownReviewPct).toBe(15);
    expect(s.preCommitmentExcerpt).toContain('24시간');
  });

  it('returns empty for invalid document', () => {
    expect(summarizeIpsDocument({ bad: true }).hasIps).toBe(false);
  });
});

describe('buildCompanionResponse with user context', () => {
  it('appends IPS line on plan_reminder', () => {
    const text = buildCompanionResponse('plan_reminder', {
      ips: summarizeIpsDocument(SAMPLE_DOC),
    });
    expect(text).toContain('저장된 IPS');
    expect(text).toContain('5–10');
  });

  it('lists active triggers on trigger_guide', () => {
    const text = buildCompanionResponse('trigger_guide', {
      triggers: [
        {
          id: '1',
          label: 'VIX 20',
          triggerType: 'macro_composite',
          isActive: true,
        },
      ],
    });
    expect(text).toContain('VIX 20');
    expect(text).toContain('trigger 1개');
  });

  it('uses pre-commitment on behavioral_calm', () => {
    const text = buildCompanionResponse('behavioral_calm', {
      ips: summarizeIpsDocument(SAMPLE_DOC),
    });
    expect(text).toContain('IPS에 적어 둔 한 문장');
    expect(text).toContain('24시간');
  });
});
