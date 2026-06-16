import { describe, expect, it } from 'vitest';

import { buildIpsDocumentFromDraft } from '../build-document';
import { createEmptyIpsDraft } from '../wizard-types';

describe('buildIpsDocumentFromDraft', () => {
  it('builds a valid document from a complete draft', () => {
    const draft = createEmptyIpsDraft();
    draft.horizon.yearsBand = 'y5_10';
    draft.pace.monthlyContributionBand = 'pct_5_10_income';
    draft.review.preCommitmentTemplateId = 'smart_precommit';
    draft.review.preCommitmentText =
      '시장이 흔들릴 때는 본인이 정한 배분과 페이스를 우선 따른다.';

    const doc = buildIpsDocumentFromDraft(draft);
    expect(doc).not.toBeNull();
    expect(doc?.schemaVersion).toBe('ips-v0.1');
    expect(doc?.review.preCommitment.acknowledgedAt).toBeDefined();
  });
});
