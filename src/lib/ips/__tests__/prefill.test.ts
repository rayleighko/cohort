import { describe, expect, it } from 'vitest';

import {
  buildPrefillFromProfile,
  createInitialDraft,
  hasAllocationMismatch,
  mapPortfolioToAllocationTargets,
} from '../prefill';

describe('ips prefill', () => {
  it('maps survey time_horizon to years band', () => {
    const prefill = buildPrefillFromProfile({ time_horizon: '3-7년' });
    expect(prefill.yearsBand).toBe('y3_5');
  });

  it('maps portfolio composition to allocation targets', () => {
    const targets = mapPortfolioToAllocationTargets({
      domestic_equity: 40,
      us_equity: 30,
      cash: 30,
    });
    expect(targets).toEqual([
      { assetClass: 'equity_kr', weightPct: 40 },
      { assetClass: 'equity_global', weightPct: 30 },
      { assetClass: 'cash', weightPct: 30 },
    ]);
  });

  it('createInitialDraft applies prefill', () => {
    const draft = createInitialDraft({
      yearsBand: 'y10_20',
      allocationTargets: [{ assetClass: 'bond_kr', weightPct: 100 }],
    });
    expect(draft.horizon.yearsBand).toBe('y10_20');
    expect(draft.allocation.targets[0]?.weightPct).toBe(100);
  });

  it('detects allocation mismatch over 5pp', () => {
    expect(
      hasAllocationMismatch(
        { domestic_equity: 50, us_equity: 50 },
        [
          { assetClass: 'equity_kr', weightPct: 40 },
          { assetClass: 'equity_global', weightPct: 60 },
        ],
      ),
    ).toBe(true);
  });
});
