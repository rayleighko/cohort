/**
 * Shared Korean labels for macro zones / indicators — used by narration
 * templates and the rule-based pace companion (zero LLM cost path).
 */
import type { MacroComposite, MacroIndicator } from '@/lib/macro/composite';

export const ZONE_LABEL_KO: Record<MacroComposite['zone'], string> = {
  dovish: '비둘기파',
  'neutral-dovish': '중립–비둘기',
  neutral: '중립',
  'neutral-hawkish': '중립–매파',
  hawkish: '매파',
};

export const INDICATOR_LABEL_KO: Record<string, string> = {
  KR_US_RATE_SPREAD: '한미 금리차',
  USDKRW: '원/달러 환율',
  VIXCLS: 'VIX 변동성 지수',
  DTWEXBGS: '달러 지수 (DXY)',
  KR_10Y: '한국 국고채 10년',
  DGS10: '미국 국채 10년',
};

export const INDICATOR_UNIT: Record<string, string> = {
  KR_US_RATE_SPREAD: '%p',
  USDKRW: '원',
  VIXCLS: '',
  DTWEXBGS: '',
  KR_10Y: '%',
  DGS10: '%',
};

export function formatIndicatorLabel(code: string, latest: number): string {
  const label = INDICATOR_LABEL_KO[code] ?? code;
  const unit = INDICATOR_UNIT[code] ?? '';
  return `${label} ${latest.toFixed(2)}${unit ? unit : ''}`;
}

export function keyDriverLabel(composite: MacroComposite): string {
  return INDICATOR_LABEL_KO[composite.keyDriver.code] ?? composite.keyDriver.code;
}
