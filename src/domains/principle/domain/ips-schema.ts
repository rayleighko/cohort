/**
 * IPS (Investment Policy Statement) — domain schema.
 *
 * Option B: user-authored rules only. No AI-generated allocation advice.
 * PIPA: portfolio fields are % weights, not absolute amounts.
 *
 * Refs: docs/specs/ips-wizard.md
 */
import { z } from 'zod';

export const IPS_SCHEMA_VERSION = 'ips-v0.1' as const;

export const horizonYearsBandSchema = z.enum([
  'lt_1y',
  'y1_3',
  'y3_5',
  'y5_10',
  'y10_20',
  'gt_20y',
]);

export const assetClassSchema = z.enum([
  'cash',
  'bond_kr',
  'bond_global',
  'equity_kr',
  'equity_global',
  'alternative',
  'other',
]);

export const allocationTargetSchema = z.object({
  assetClass: assetClassSchema,
  weightPct: z.number().min(0).max(100),
});

export const lossLimitActionSchema = z.enum([
  'pause_new_buys',
  'review_only',
  'rebalance_to_targets',
  'custom_note',
]);

export const monthlyContributionBandSchema = z.enum([
  'none',
  'under_5pct_income',
  'pct_5_10_income',
  'pct_10_20_income',
  'over_20pct_income',
]);

export const rebalanceCadenceSchema = z.enum([
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'threshold_only',
]);

export const reviewCadenceSchema = z.enum([
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
]);

export const ipsHorizonSchema = z.object({
  yearsBand: horizonYearsBandSchema,
  /** User note — optional context, not advice. */
  note: z.string().max(500).optional(),
});

export const ipsAllocationSchema = z.object({
  targets: z.array(allocationTargetSchema).min(1).max(8),
});

export const ipsLossLimitSchema = z.object({
  /** Portfolio drawdown % at which user commits to review (not auto-sell). */
  maxDrawdownReviewPct: z.number().min(1).max(50),
  action: lossLimitActionSchema,
  customNote: z.string().max(500).optional(),
});

export const ipsPaceSchema = z.object({
  monthlyContributionBand: monthlyContributionBandSchema,
  splitBuyRule: z.string().max(500).optional(),
});

export const ipsRebalanceSchema = z.object({
  driftThresholdPct: z.number().min(1).max(25),
  cadence: rebalanceCadenceSchema,
});

export const ipsReviewSchema = z.object({
  cadence: reviewCadenceSchema,
  preCommitment: z.object({
    text: z.string().min(20).max(2000),
    acknowledgedAt: z.string().datetime().optional(),
  }),
});

export const ipsDocumentSchema = z
  .object({
    schemaVersion: z.literal(IPS_SCHEMA_VERSION),
    horizon: ipsHorizonSchema,
    allocation: ipsAllocationSchema,
    lossLimit: ipsLossLimitSchema,
    pace: ipsPaceSchema,
    rebalance: ipsRebalanceSchema,
    review: ipsReviewSchema,
  })
  .superRefine((doc, ctx) => {
    const sum = doc.allocation.targets.reduce((a, t) => a + t.weightPct, 0);
    if (Math.abs(sum - 100) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `allocation targets must sum to 100% (got ${sum.toFixed(2)})`,
        path: ['allocation', 'targets'],
      });
    }
    if (
      doc.lossLimit.action === 'custom_note' &&
      !doc.lossLimit.customNote?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'customNote required when action is custom_note',
        path: ['lossLimit', 'customNote'],
      });
    }
  });

export type IpsDocument = z.infer<typeof ipsDocumentSchema>;
export type IpsHorizon = z.infer<typeof ipsHorizonSchema>;
export type IpsAllocation = z.infer<typeof ipsAllocationSchema>;

/** Parse and validate IPS JSON — throws ZodError on failure. */
export function parseIpsDocument(input: unknown): IpsDocument {
  return ipsDocumentSchema.parse(input);
}

/** Safe parse for API routes. */
export function safeParseIpsDocument(input: unknown) {
  return ipsDocumentSchema.safeParse(input);
}

/** Sum allocation weights (for UI live total). */
export function sumAllocationWeights(
  targets: IpsAllocation['targets'],
): number {
  return targets.reduce((a, t) => a + t.weightPct, 0);
}
