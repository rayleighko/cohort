/**
 * GL-RTS 13문항 UI SoT — docs/handoff-20260611/gl-rts-13-korean.md
 * profile_version = 'glrts-ko-v0.1'
 * Q12: a=1, b=2, c=3 only (시중 핸드아웃 D=4 오타 — 구현 금지)
 */

export type GlRtsOptionId = 'a' | 'b' | 'c' | 'd';

export type GlRtsQuestionId =
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'q8'
  | 'q9'
  | 'q10'
  | 'q11'
  | 'q12'
  | 'q13';

export type GlRtsAnswers = Partial<Record<GlRtsQuestionId, GlRtsOptionId>>;

export interface GlRtsOption {
  id: GlRtsOptionId;
  label: string;
}

export interface GlRtsQuestion {
  id: GlRtsQuestionId;
  number: number;
  prompt: string;
  options: GlRtsOption[];
  /** 1줄 측정 설명 — "근거 보기" 토글 */
  rationale: string;
  source: string;
}

export const GL_RTS_QUESTIONS: GlRtsQuestion[] = [
  {
    id: 'q1',
    number: 1,
    prompt: '가장 친한 친구는 당신을 어떤 사람이라고 표현할까요?',
    options: [
      { id: 'a', label: '타고난 승부사' },
      { id: 'b', label: '충분히 알아본 뒤에는 위험을 감수하는 사람' },
      { id: 'c', label: '신중한 사람' },
      { id: 'd', label: '위험은 무조건 피하는 사람' },
    ],
    rationale: '타인 시점을 빌린 자기보고 — 사회적 자기상으로서의 위험감수 성향.',
    source: 'Grable & Lytton (1999) 1번 문항',
  },
  {
    id: 'q2',
    number: 2,
    prompt:
      'TV 퀴즈쇼에서 우승해 다음 중 하나를 고를 수 있습니다. 무엇을 선택하시겠어요?',
    options: [
      { id: 'a', label: '현금 100만 원' },
      { id: 'b', label: '50% 확률로 500만 원' },
      { id: 'c', label: '25% 확률로 1,000만 원' },
      { id: 'd', label: '5% 확률로 1억 원' },
    ],
    rationale: '확률–보상 트레이드오프. 단순 기대값 극대화로 설명되지 않는 위험선호를 포착.',
    source: 'Grable & Lytton (1999) 2번 문항',
  },
  {
    id: 'q3',
    number: 3,
    prompt:
      '"일생에 한 번뿐인" 여행 경비를 다 모았습니다. 출발 3주 전, 직장을 잃었습니다. 어떻게 하시겠어요?',
    options: [
      { id: 'a', label: '여행을 취소한다' },
      { id: 'b', label: '훨씬 소박한 여행으로 바꾼다' },
      { id: 'c', label: '구직을 준비할 시간도 필요하니 예정대로 떠난다' },
      { id: 'd', label: '마지막 기회일지 모르니 일정을 늘려 최고급으로 다녀온다' },
    ],
    rationale: '소득 충격 직후의 소비·위험 행동 — 재무 스트레스 상황에서의 태도.',
    source: 'Grable & Lytton (1999) 3번 문항',
  },
  {
    id: 'q4',
    number: 4,
    prompt: '예상치 못하게 2,000만 원이 생겨 투자할 수 있다면?',
    options: [
      { id: 'a', label: '예금·MMF·예금자보호 상품에 넣는다' },
      { id: 'b', label: '안전한 우량 채권이나 채권형 펀드에 투자한다' },
      { id: 'c', label: '주식이나 주식형 펀드에 투자한다' },
    ],
    rationale: '여유자금의 자산군 선택. 한국 맥락의 예금자보호 상품으로 현지화.',
    source: 'Grable & Lytton (1999) 4번 문항',
  },
  {
    id: 'q5',
    number: 5,
    prompt: '경험에 비추어, 주식·주식형 펀드 투자가 얼마나 편안하신가요?',
    options: [
      { id: 'a', label: '전혀 편안하지 않다' },
      { id: 'b', label: '어느 정도 편안하다' },
      { id: 'c', label: '매우 편안하다' },
    ],
    rationale: '위험 경험·편안함(risk comfort and experience) 자기보고형 문항.',
    source: 'Grable & Lytton (1999) 5번 문항',
  },
  {
    id: 'q6',
    number: 6,
    prompt: "'위험(리스크)'이라는 단어를 들으면 가장 먼저 떠오르는 것은?",
    options: [
      { id: 'a', label: '손실' },
      { id: 'b', label: '불확실성' },
      { id: 'c', label: '기회' },
      { id: 'd', label: '짜릿함' },
    ],
    rationale: '위험의 인지적 프레임(연상) 측정.',
    source: 'Grable & Lytton (1999) 6번 문항',
  },
  {
    id: 'q7',
    number: 7,
    prompt:
      '전문가들이 금·보석·수집품·부동산 같은 실물자산 가격 상승을 예측합니다. 채권 가격은 하락할 수 있지만, 국채는 비교적 안전하다는 데는 의견이 일치합니다. 당신의 투자자산 대부분은 현재 고금리 국채입니다. 어떻게 하시겠어요?',
    options: [
      { id: 'a', label: '국채를 그대로 보유한다' },
      { id: 'b', label: '국채를 팔아 절반은 MMF에, 절반은 실물자산에 넣는다' },
      { id: 'c', label: '국채를 모두 팔아 전액 실물자산에 넣는다' },
      { id: 'd', label: '국채를 모두 팔아 실물자산에 넣고, 돈을 더 빌려 추가 매수한다' },
    ],
    rationale: '포트폴리오 전환 + 레버리지 의향. 4점 선택지는 차입 투자.',
    source: 'Grable & Lytton (1999) 7번 문항',
  },
  {
    id: 'q8',
    number: 8,
    prompt: '아래 네 가지 투자안의 최선/최악 수익을 보고 하나를 고른다면?',
    options: [
      { id: 'a', label: '최선 +20만 원 / 최악 0원' },
      { id: 'b', label: '최선 +80만 원 / 최악 −20만 원' },
      { id: 'c', label: '최선 +260만 원 / 최악 −80만 원' },
      { id: 'd', label: '최선 +480만 원 / 최악 −240만 원' },
    ],
    rationale: '손익 비대칭 구간 선택 — 손실 허용 범위 시각화의 원형.',
    source: 'Grable & Lytton (1999) 8번 문항',
  },
  {
    id: 'q9',
    number: 9,
    prompt:
      '지금 가진 것과 별개로 100만 원을 받았습니다. 다음 중 하나를 고르세요.',
    options: [
      { id: 'a', label: '확실하게 50만 원을 더 받는다' },
      { id: 'b', label: '50% 확률로 100만 원을 더 받거나, 50% 확률로 아무것도 받지 않는다' },
    ],
    rationale:
      '이득 프레임 확실성 선택. Q10과 평균하여 합산 가능(원전 각주). 손실회피 패턴 신호.',
    source: 'Grable & Lytton (1999) 9번 문항',
  },
  {
    id: 'q10',
    number: 10,
    prompt:
      '지금 가진 것과 별개로 200만 원을 받았습니다. 다음 중 하나를 고르세요.',
    options: [
      { id: 'a', label: '확실하게 50만 원을 잃는다' },
      { id: 'b', label: '50% 확률로 100만 원을 잃거나, 50% 확률로 아무것도 잃지 않는다' },
    ],
    rationale:
      '손실 프레임 확실성 선택. Q9와 평균하여 합산. 처분효과·뇌동매매 신호와 직접 연결.',
    source: 'Grable & Lytton (1999) 10번 문항',
  },
  {
    id: 'q11',
    number: 11,
    prompt:
      '친척이 1억 원을 유산으로 남기며, 전액을 아래 중 단 하나에 투자하라는 조건을 달았습니다. 무엇을 고르시겠어요?',
    options: [
      { id: 'a', label: '예금 또는 MMF' },
      { id: 'b', label: '주식·채권 혼합형 펀드' },
      { id: 'c', label: '보통주 15종목 포트폴리오' },
      { id: 'd', label: '금·은·원유 같은 원자재' },
    ],
    rationale: '강제 단일 선택 자산배분 — 분산 불가 조건에서의 위험선호.',
    source: 'Grable & Lytton (1999) 11번 문항',
  },
  {
    id: 'q12',
    number: 12,
    prompt: '2,000만 원을 투자해야 한다면, 어떤 구성이 가장 끌리시나요?',
    options: [
      { id: 'a', label: '저위험 60% / 중위험 30% / 고위험 10%' },
      { id: 'b', label: '저위험 30% / 중위험 40% / 고위험 30%' },
      { id: 'c', label: '저위험 10% / 중위험 40% / 고위험 50%' },
    ],
    rationale:
      '명시적 위험 비중 포트폴리오 선택(3지선다). 채점 a=1, b=2, c=3 — D=4 오타 주의.',
    source: 'Grable & Lytton (1999) 12번 문항',
  },
  {
    id: 'q13',
    number: 13,
    prompt:
      '신뢰하는 친구(경력 많은 지질학자)가 금광 탐사 벤처 투자자를 모으고 있습니다. 성공하면 투자금의 50–100배를 돌려받지만, 실패하면 전액 손실입니다. 친구가 추정하는 성공 확률은 20%입니다. 돈이 있다면 얼마를 투자하시겠어요?',
    options: [
      { id: 'a', label: '투자하지 않는다' },
      { id: 'b', label: '한 달치 급여' },
      { id: 'c', label: '세 달치 급여' },
      { id: 'd', label: '여섯 달치 급여' },
    ],
    rationale: '저확률–초고배당 투기 베팅 규모 — 투기적 위험 요인의 대표 문항.',
    source: 'Grable & Lytton (1999) 13번 문항',
  },
];

export const GL_RTS_QUESTION_IDS = GL_RTS_QUESTIONS.map((q) => q.id);

export const PROFILE_VERSION_GLRTS = 'glrts-ko-v0.1' as const;
