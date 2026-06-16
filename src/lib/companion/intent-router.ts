/**
 * Rule-based intent router — no LLM. Maps user text or quick-action id
 * to a companion response template key.
 */
export type CompanionIntent =
  | 'macro_today'
  | 'plan_reminder'
  | 'split_buy_pace'
  | 'trigger_guide'
  | 'behavioral_calm'
  | 'ips_guide'
  | 'service_info'
  | 'advisory_redirect'
  | 'general_fallback';

const QUICK_ACTION_INTENTS: Record<string, CompanionIntent> = {
  macro_today: 'macro_today',
  plan_reminder: 'plan_reminder',
  split_buy_pace: 'split_buy_pace',
  trigger_guide: 'trigger_guide',
  behavioral_calm: 'behavioral_calm',
  ips_guide: 'ips_guide',
};

const MACRO_RE =
  /(매크로|macro|composite|금리|환율|vix|dxy|fomc|연준|한국은행|기준금리|score|zone|오늘\s*시장)/i;
const PLAN_RE =
  /(plan|플랜|ips|원칙|투자\s*원칙|배분|목표\s*비중|리밸런싱|페이스)/i;
const SPLIT_RE = /(분할|적립|매수\s*페이스|dca|월\s*투자|추가\s*투자)/i;
const TRIGGER_RE = /(trigger|트리거|알림|조건|shape\s*c|발동)/i;
const CALM_RE =
  /(panic|패닉|무서|두려|불안|fomo|충동|후회|손절|존버|흔들|멘탈)/i;
const IPS_RE = /(ips\s*작성|원칙\s*작성|위저드|문서화)/i;
const SERVICE_RE = /(cohort|코호트|뭐\s*하는|서비스|기능|aurora|vesper|오로라)/i;
const ADVISORY_RE =
  /(추천|권장|사\s*도\s*될|팔\s*도\s*될|매수\s*해도|매도\s*해도|비중\s*\d|지금\s*매수|지금\s*매도|timing|타이밍|목표\s*가)/i;

export function resolveCompanionIntent(input: {
  message?: string;
  quickActionId?: string;
  layer1Advisory?: boolean;
}): CompanionIntent {
  if (input.layer1Advisory || (input.message && ADVISORY_RE.test(input.message))) {
    return 'advisory_redirect';
  }

  if (input.quickActionId && QUICK_ACTION_INTENTS[input.quickActionId]) {
    return QUICK_ACTION_INTENTS[input.quickActionId];
  }

  const msg = (input.message ?? '').trim();
  if (!msg) return 'general_fallback';

  if (MACRO_RE.test(msg)) return 'macro_today';
  if (IPS_RE.test(msg)) return 'ips_guide';
  if (TRIGGER_RE.test(msg)) return 'trigger_guide';
  if (SPLIT_RE.test(msg)) return 'split_buy_pace';
  if (CALM_RE.test(msg)) return 'behavioral_calm';
  if (PLAN_RE.test(msg)) return 'plan_reminder';
  if (SERVICE_RE.test(msg)) return 'service_info';

  return 'general_fallback';
}

export const COMPANION_QUICK_ACTIONS = [
  { id: 'macro_today', label: '오늘 매크로' },
  { id: 'plan_reminder', label: '본인 plan' },
  { id: 'split_buy_pace', label: '분할매수 페이스' },
  { id: 'trigger_guide', label: 'trigger 안내' },
  { id: 'behavioral_calm', label: '흔들릴 때' },
  { id: 'ips_guide', label: 'IPS 작성' },
] as const;
