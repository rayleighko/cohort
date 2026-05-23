/**
 * Macro snapshot orchestrator — fetches the Day 6 score-contributing
 * series in parallel, then runs computeMacroComposite. Single source of
 * truth for both /api/macro (external) and /dashboard (internal RSC).
 *
 * Partial fetch failures degrade the composite (re-weights present
 * indicators); total failure throws — callers map that to a 503.
 */
import {
  computeMacroComposite,
  type MacroComposite,
} from './composite';
import {
  getEcosSeries,
  type EcosObservation,
  EcosFetchError,
} from './ecos';
import {
  getFredSeries,
  type FredObservation,
  FredFetchError,
} from './fred';

const ECOS_REQUIRED = ['KR_10Y', 'USDKRW'] as const;
const FRED_REQUIRED = ['DGS10', 'VIXCLS', 'DTWEXBGS'] as const;

export interface MacroSnapshot {
  composite: MacroComposite;
  fetchedAt: string;
  fetchErrors: Array<{ source: 'ecos' | 'fred'; code: string; message: string }>;
}

export async function getMacroSnapshot(): Promise<MacroSnapshot> {
  const [ecosResults, fredResults] = await Promise.all([
    Promise.allSettled(
      ECOS_REQUIRED.map(
        (code) =>
          getEcosSeries(code).then(
            (obs) => [code, obs] as [string, EcosObservation[]],
          ),
      ),
    ),
    Promise.allSettled(
      FRED_REQUIRED.map(
        (id) =>
          getFredSeries(id).then(
            (obs) => [id, obs] as [string, FredObservation[]],
          ),
      ),
    ),
  ]);

  const ecos: Record<string, EcosObservation[]> = {};
  const fred: Record<string, FredObservation[]> = {};
  const fetchErrors: MacroSnapshot['fetchErrors'] = [];

  ecosResults.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const [code, obs] = r.value;
      ecos[code] = obs;
    } else {
      fetchErrors.push({
        source: 'ecos',
        code: ECOS_REQUIRED[i],
        message:
          r.reason instanceof EcosFetchError
            ? r.reason.message
            : 'unknown error',
      });
    }
  });
  fredResults.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const [id, obs] = r.value;
      fred[id] = obs;
    } else {
      fetchErrors.push({
        source: 'fred',
        code: FRED_REQUIRED[i],
        message:
          r.reason instanceof FredFetchError
            ? r.reason.message
            : 'unknown error',
      });
    }
  });

  const composite = computeMacroComposite({ ecos, fred });
  return {
    composite,
    fetchedAt: new Date().toISOString(),
    fetchErrors,
  };
}
