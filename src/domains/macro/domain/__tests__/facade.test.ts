import { describe, expect, it } from 'vitest';
import { computeMacroComposite } from '../index';

describe('macro domain facade', () => {
  it('re-exports computeMacroComposite from lib/macro', () => {
    const date = '2026-06-01';
    const result = computeMacroComposite({
      ecos: {
        KR_10Y: [{ date, value: 3.25 }],
        USDKRW: [{ date, value: 1365 }],
      },
      fred: {
        DGS10: [{ date, value: 4.25 }],
        VIXCLS: [{ date, value: 16.5 }],
        DTWEXBGS: [{ date, value: 103 }],
      },
    });
    expect(result.score).toBeTypeOf('number');
    expect(result.indicators).toHaveLength(4);
  });
});
