import { describe, expect, it } from 'vitest';
import {
  buildIpsDocumentFromDraft,
  draftFromIpsDocument,
} from '@/lib/ips/build-document';
import { createEmptyIpsDraft } from '@/lib/ips/wizard-types';
import { IPS_SCHEMA_VERSION } from '@/domains/principle/domain/ips-schema';

describe('draftFromIpsDocument', () => {
  it('round-trips through buildIpsDocumentFromDraft', () => {
    const draft = {
      ...createEmptyIpsDraft(),
      horizon: { yearsBand: 'y5_10' as const, note: '장기' },
      pace: { monthlyContributionBand: 'pct_5_10_income' as const, splitBuyRule: '' },
      review: {
        cadence: 'monthly' as const,
        preCommitmentTemplateId: 'calm',
        preCommitmentText: '흔들릴 때는 plan만 보고 24시간 유예한다.',
      },
    };
    const doc = buildIpsDocumentFromDraft(draft);
    expect(doc).not.toBeNull();
    const restored = draftFromIpsDocument(doc!);
    expect(restored.horizon.yearsBand).toBe('y5_10');
    expect(restored.review.preCommitmentText).toContain('24시간');
    expect(restored.review.preCommitmentTemplateId).toBe('custom');
  });
});

describe('buildIpsDocumentFromDraft', () => {
  it('sets schema version ips-v0.1', () => {
    const draft = createEmptyIpsDraft();
    draft.horizon.yearsBand = 'y3_5';
    draft.pace.monthlyContributionBand = 'none';
    draft.review.cadence = 'monthly';
    draft.review.preCommitmentTemplateId = 'custom';
    draft.review.preCommitmentText =
      '흔들릴 때는 본인 plan 페이스를 우선하고 충동 매매는 미룬다.';
    const doc = buildIpsDocumentFromDraft(draft);
    expect(doc?.schemaVersion).toBe(IPS_SCHEMA_VERSION);
  });
});
