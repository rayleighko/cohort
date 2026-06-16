/**
 * Map onboarding survey fields → IPS wizard prefill.
 * Refs: docs/handoff-20260611/survey-merge-map.md
 */
import type { AssetClass } from '@/domains/principle/domain/ips-schema';
import type { PortfolioAssetKey } from '@/lib/profile/survey-factual-options';
import type { IpsProfilePrefill, IpsWizardDraft } from './wizard-types';
import { createEmptyIpsDraft } from './wizard-types';

export interface SurveyProfileSlice {
  time_horizon?: string | null;
  portfolio_composition_pct?: Record<string, number> | null;
  split_buy_enforcement?: string | null;
  plan_formalization?: string | null;
}

const TIME_HORIZON_TO_BAND: Record<string, IpsProfilePrefill['yearsBand']> = {
  '3년 이하': 'y1_3',
  '3-7년': 'y3_5',
  '7-15년': 'y5_10',
  '15년 이상 / 세대 이전': 'gt_20y',
};

const PORTFOLIO_KEY_TO_ASSET: Record<PortfolioAssetKey, AssetClass> = {
  domestic_equity: 'equity_kr',
  us_equity: 'equity_global',
  bond: 'bond_kr',
  cash: 'cash',
  crypto: 'alternative',
  other: 'other',
};

export function mapPortfolioToAllocationTargets(
  pct: Record<string, number> | null | undefined,
): { assetClass: AssetClass; weightPct: number }[] | undefined {
  if (!pct) return undefined;
  const targets = Object.entries(pct)
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .map(([key, weightPct]) => ({
      assetClass: PORTFOLIO_KEY_TO_ASSET[key as PortfolioAssetKey] ?? 'other',
      weightPct,
    }));
  return targets.length > 0 ? targets : undefined;
}

export function buildPrefillFromProfile(
  profile: SurveyProfileSlice | null | undefined,
): IpsProfilePrefill {
  if (!profile) return {};
  const prefill: IpsProfilePrefill = {};
  if (profile.time_horizon && TIME_HORIZON_TO_BAND[profile.time_horizon]) {
    prefill.yearsBand = TIME_HORIZON_TO_BAND[profile.time_horizon];
  }
  const targets = mapPortfolioToAllocationTargets(profile.portfolio_composition_pct ?? undefined);
  if (targets) prefill.allocationTargets = targets;
  if (profile.split_buy_enforcement) {
    prefill.splitBuyHint = profile.split_buy_enforcement;
  }
  if (profile.plan_formalization) {
    prefill.planFormalizationHint = profile.plan_formalization;
  }
  return prefill;
}

export function applyPrefillToDraft(
  draft: IpsWizardDraft,
  prefill: IpsProfilePrefill,
): IpsWizardDraft {
  const next = { ...draft, horizon: { ...draft.horizon }, allocation: { ...draft.allocation } };
  if (prefill.yearsBand) next.horizon.yearsBand = prefill.yearsBand;
  if (prefill.allocationTargets?.length) {
    next.allocation = { targets: prefill.allocationTargets.map((t) => ({ ...t })) };
  }
  if (prefill.splitBuyHint && !next.pace.splitBuyRule) {
    next.pace = {
      ...next.pace,
      splitBuyRule: `설문 기록: ${prefill.splitBuyHint}`,
    };
  }
  return next;
}

export function createInitialDraft(prefill?: IpsProfilePrefill): IpsWizardDraft {
  const base = createEmptyIpsDraft();
  return prefill ? applyPrefillToDraft(base, prefill) : base;
}

/** Compare survey actual % (Q2) vs IPS target — educational only (Option B). */
export function hasAllocationMismatch(
  actualPct: Record<string, number> | null | undefined,
  targets: { assetClass: AssetClass; weightPct: number }[],
): boolean {
  const actualTargets = mapPortfolioToAllocationTargets(actualPct);
  if (!actualTargets?.length || !targets.length) return false;
  const byClass = (list: typeof targets) =>
    Object.fromEntries(list.map((t) => [t.assetClass, t.weightPct]));
  const a = byClass(actualTargets);
  const b = byClass(targets);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const diff = Math.abs((a[k as AssetClass] ?? 0) - (b[k as AssetClass] ?? 0));
    if (diff > 5) return true;
  }
  return false;
}
