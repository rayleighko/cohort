/**
 * Pre-commitment starter phrases — research-attributed, first-person, Option B safe.
 * User selects a template then may edit; final text is stored as preCommitment.text.
 * Refs: cohort-ideation-2026-06.md §2 (Thaler SMarT, CFA IPS, Barber-Odean turnover)
 */
export interface PreCommitmentTemplate {
  id: string;
  title: string;
  /** Short attribution — not investment advice */
  source: string;
  text: string;
}

export const PRE_COMMITMENT_TEMPLATES: PreCommitmentTemplate[] = [
  {
    id: 'smart_precommit',
    title: '평온할 때 정한 페이스 유지',
    source: 'Thaler & Benartzi — precommitment (SMarT, 2004)',
    text:
      '시장이 크게 움직여도, 평온할 때 정한 배분과 추가 투자 페이스를 우선 따른다. ' +
      '감정이 올라온 날에는 새로운 매매 결정을 미루고, 미리 적어 둔 plan을 다시 읽는다.',
  },
  {
    id: 'cfa_ips',
    title: '혼란기에는 IPS부터 다시 읽기',
    source: 'CFA Institute — Investment Policy Statement framework',
    text:
      '시장 혼란이 커질수록 본인 IPS를 먼저 연다. plan 변경은 충분히 쉬운 날, ' +
      '새 정보와 본인 목표를 함께 검토한 뒤에만 한다.',
  },
  {
    id: 'barber_odean',
    title: '잦은 매매 자제 · plan 우선',
    source: 'Barber & Odean (2000) — turnover and returns',
    text:
      '확신 없이 거래 횟수를 늘리지 않는다. 본인 plan에서 벗어나려 할 때는 ' +
      '한 번 멈추고, 왜 plan과 다른 행동을 하려는지 기록한다.',
  },
  {
    id: 'kahneman_slow',
    title: '천천히 결정 · 감정과 분리',
    source: 'Kahneman — System 1 / 2 (Thinking, Fast and Slow)',
    text:
      '급한 마음이 들 때는 24시간 유예 규칙을 적용한다. 그동안 plan과 배분만 확인하고, ' +
      '충동적 일괄 매매는 하지 않는다.',
  },
  {
    id: 'custom',
    title: '직접 작성',
    source: '본인 문장 (아래에서 자유롭게)',
    text: '',
  },
];

export const DRAWDOWN_HELP_TEXT =
  'Drawdown(낙폭)은 고점 대비 자산이 얼마나 하락했는지를 %로 나타낸 지표예요. ' +
  '예: 평가액 100에서 85가 되면 drawdown은 15%입니다. ' +
  '코호트는 자동 매매하지 않으며, 본인이 정한 %에 도달하면 plan 검토를 상기시켜 드립니다.';

export const PRE_COMMITMENT_INTRO =
  '연구·프레임워크에서 자주 쓰이는 문장을 골라 시작할 수 있어요. 선택 후 본인 말투로 고쳐 쓰셔도 됩니다.';
