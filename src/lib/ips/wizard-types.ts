import type {
  AssetClass,
  HorizonYearsBand,
  LossLimitAction,
  MonthlyContributionBand,
  RebalanceCadence,
  ReviewCadence,
} from '@/domains/principle/domain/ips-schema';

/** In-progress wizard state (client-only until V2-004 API). */
export interface IpsWizardDraft {
  horizon: {
    yearsBand: HorizonYearsBand | '';
    note: string;
  };
  allocation: {
    targets: { assetClass: AssetClass; weightPct: number }[];
  };
  lossLimit: {
    maxDrawdownReviewPct: number;
    action: LossLimitAction | '';
    customNote: string;
  };
  pace: {
    monthlyContributionBand: MonthlyContributionBand | '';
    splitBuyRule: string;
  };
  rebalance: {
    driftThresholdPct: number;
    cadence: RebalanceCadence | '';
  };
  review: {
    cadence: ReviewCadence | '';
    /** Selected starter template id, or `custom` */
    preCommitmentTemplateId: string;
    preCommitmentText: string;
  };
}

export interface IpsProfilePrefill {
  yearsBand?: HorizonYearsBand;
  allocationTargets?: { assetClass: AssetClass; weightPct: number }[];
  splitBuyHint?: string;
  planFormalizationHint?: string;
}

export function createEmptyIpsDraft(): IpsWizardDraft {
  return {
    horizon: { yearsBand: '', note: '' },
    allocation: {
      targets: [
        { assetClass: 'bond_kr', weightPct: 40 },
        { assetClass: 'equity_global', weightPct: 60 },
      ],
    },
    lossLimit: {
      maxDrawdownReviewPct: 15,
      action: 'review_only',
      customNote: '',
    },
    pace: { monthlyContributionBand: '', splitBuyRule: '' },
    rebalance: { driftThresholdPct: 5, cadence: 'quarterly' },
    review: { cadence: 'monthly', preCommitmentTemplateId: '', preCommitmentText: '' },
  };
}
