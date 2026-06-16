/**
 * IPS wizard — client-safe Korean labels (Option B copy).
 * Refs: docs/specs/ips-wizard.md
 */
import type {
  AssetClass,
  HorizonYearsBand,
  LossLimitAction,
  MonthlyContributionBand,
  RebalanceCadence,
  ReviewCadence,
} from '@/domains/principle/domain/ips-schema';

export const IPS_STEP_IDS = [
  'horizon',
  'allocation',
  'loss_limit',
  'pace',
  'rebalance',
  'review',
] as const;

export type IpsStepId = (typeof IPS_STEP_IDS)[number];

export const IPS_STEP_TITLES: Record<IpsStepId, string> = {
  horizon: '투자 기간 · 목표',
  allocation: '목표 자산 배분 (%)',
  loss_limit: '손실 한계 · 검토 트리거',
  pace: '추가 투자 페이스',
  rebalance: '리밸런싱 규칙',
  review: '흔들릴 때 읽을 한 문장',
};

export const HORIZON_BAND_OPTIONS: { value: HorizonYearsBand; label: string }[] = [
  { value: 'lt_1y', label: '1년 미만' },
  { value: 'y1_3', label: '1–3년' },
  { value: 'y3_5', label: '3–5년' },
  { value: 'y5_10', label: '5–10년' },
  { value: 'y10_20', label: '10–20년' },
  { value: 'gt_20y', label: '20년 이상 / 세대 이전' },
];

export const ASSET_CLASS_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: 'cash', label: '현금 · 예금 · MMF' },
  { value: 'bond_kr', label: '국내 채권 · 채권형' },
  { value: 'bond_global', label: '해외 채권 · 채권형' },
  { value: 'equity_kr', label: '국내 주식 · ETF' },
  { value: 'equity_global', label: '해외 주식 · ETF' },
  { value: 'alternative', label: '대체 · 가상자산 등' },
  { value: 'other', label: '기타' },
];

export const LOSS_LIMIT_ACTION_OPTIONS: { value: LossLimitAction; label: string }[] = [
  { value: 'review_only', label: '본인 plan에 따라 검토만 (매매 자동 없음)' },
  { value: 'pause_new_buys', label: '신규 매수 일시 중단 후 검토' },
  { value: 'rebalance_to_targets', label: '목표 배분으로 되돌리기 검토' },
  { value: 'custom_note', label: '본인 메모에 따른 행동 (직접 입력)' },
];

export const CONTRIBUTION_BAND_OPTIONS: {
  value: MonthlyContributionBand;
  label: string;
}[] = [
  { value: 'none', label: '추가 투자 없음 / 적립 중단 중' },
  { value: 'under_5pct_income', label: '소득의 5% 미만' },
  { value: 'pct_5_10_income', label: '소득의 5–10%' },
  { value: 'pct_10_20_income', label: '소득의 10–20%' },
  { value: 'over_20pct_income', label: '소득의 20% 초과' },
];

export const REBALANCE_CADENCE_OPTIONS: { value: RebalanceCadence; label: string }[] = [
  { value: 'threshold_only', label: '편차 임계치 도달 시만' },
  { value: 'monthly', label: '월 1회 점검' },
  { value: 'quarterly', label: '분기 1회' },
  { value: 'semi_annual', label: '반기 1회' },
  { value: 'annual', label: '연 1회' },
];

export const REVIEW_CADENCE_OPTIONS: { value: ReviewCadence; label: string }[] = [
  { value: 'weekly', label: '주 1회' },
  { value: 'biweekly', label: '2주 1회' },
  { value: 'monthly', label: '월 1회' },
  { value: 'quarterly', label: '분기 1회' },
];

export const PLAN_FORMALIZATION_HINTS: Record<string, string> = {
  '문서화된 plan': '이미 문서화된 plan이 있으시군요. 아래 내용은 그 plan을 한곳에 모아 두는 과정이에요.',
  '머릿속 plan': '머릿속 plan을 글로 옮겨 두면, 흔들릴 때 본인 문장을 다시 볼 수 있어요.',
  'plan 형성 중': '지금 정리하는 내용이 앞으로의 본인 plan 초안이 됩니다.',
};
