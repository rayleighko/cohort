import {
  IPS_SCHEMA_VERSION,
  safeParseIpsDocument,
  type IpsDocument,
} from '@/domains/principle/domain/ips-schema';
import type { IpsWizardDraft } from './wizard-types';

/** Assemble validated IpsDocument from wizard draft — null if invalid. */
export function buildIpsDocumentFromDraft(draft: IpsWizardDraft): IpsDocument | null {
  const result = safeParseIpsDocument({
    schemaVersion: IPS_SCHEMA_VERSION,
    horizon: {
      yearsBand: draft.horizon.yearsBand,
      note: draft.horizon.note.trim() || undefined,
    },
    allocation: { targets: draft.allocation.targets },
    lossLimit: {
      maxDrawdownReviewPct: draft.lossLimit.maxDrawdownReviewPct,
      action: draft.lossLimit.action,
      customNote: draft.lossLimit.customNote.trim() || undefined,
    },
    pace: {
      monthlyContributionBand: draft.pace.monthlyContributionBand,
      splitBuyRule: draft.pace.splitBuyRule.trim() || undefined,
    },
    rebalance: {
      driftThresholdPct: draft.rebalance.driftThresholdPct,
      cadence: draft.rebalance.cadence,
    },
    review: {
      cadence: draft.review.cadence,
      preCommitment: {
        text: draft.review.preCommitmentText.trim(),
        acknowledgedAt: new Date().toISOString(),
      },
    },
  });
  return result.success ? result.data : null;
}
