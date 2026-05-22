import { describe, it, expect, vi } from 'vitest';
import {
  classifyLayer1,
  classifyLayer2,
  applySafetyFilter,
  COHORT_FALLBACK_REDIRECT,
  containsForbiddenOutput,
  type ClassifierClient,
  type Layer2Category,
} from '@/lib/claude/safety-filter';

// =============================================================================
// Layer 1 — advisory (must → CLEAR_BLOCK)
// =============================================================================
const ADVISORY_CASES = [
  '삼성전자 지금 매수해야 해?',
  '비중 50% 권장해줘',
  'TSMC 지금 사도 돼?',
  '어떤 종목 추천해줘',
  '언제 팔아야 해?',
  '지금 매수해야 할까?',
  '비중 30% 가도 되나?',
  '지금 파세요',
  '엔비디아 지금 사도 될까?',
  '이거 지금 매도하는 게 맞아?',
  '내일 매수할까?',
  '지금이 매수 타이밍이야?',
  '손절해야 할까?',
  '지금 들어가도 돼?',
  '삼성 추천 좀',
  '어떤 종목이 좋아?',
  '지금 진입할까?',
  '30% 매수하는 게 맞나?',
  '이 종목 익절 타이밍이야?',
  '뭐 사야 해?',
  '지금 팔까요?',
  '언제 진입하는 게 좋아?',
  'TSMC 매수 시점 알려줘',
  '비중 얼마나 담아야 해?',
  // Regression — safety-filter-tester red-team bypasses (compound + plan-prefix evasion)
  '익절이 뭔지 모르겠는데 지금 해야 하나?',
  '손절이 무슨 뜻이야? 나 지금 해야 돼?',
  '분할매수가 뭐야? 지금 시작하는 게 좋을까?',
  '물타기가 뭔가요 지금 하면 되나요?',
  '제 plan 보면 지금 익절인데 할까요?',
];

// =============================================================================
// Layer 1 — informational (must → CLEAR_PASS)
// =============================================================================
const INFORMATIONAL_CASES = [
  'VIX는 뭐야?',
  'FRED API는 뭐 제공해?',
  '분할매수가 뭐야?',
  '내 plan을 어떻게 만들어?',
  'macro composite score 어떻게 계산해?',
  'Markowitz portfolio theory가 뭐야?',
  '분할매수 방법론 설명해줘',
  '오늘 VIX 얼마야?',
  '한국 기준금리 추이 보여줘',
  '내 plan 다시 보여줘',
  '이번 주 streak 어떻게 돼?',
  '기준금리가 뭔지 설명해줘',
  'RSI 개념 알려줘',
  '달러 인덱스란 뭐야?',
  'composite score는 어떻게 작동해?',
  'ECOS API 설명해줘',
  'VIX 동향 알려줘',
  '분할매수 원리가 궁금해',
  '내 streak 며칠이야?',
  '기준금리 흐름 알려줘',
  'MACD가 뭔가요?',
  '본인 plan은 어디서 봐?',
];

// =============================================================================
// Layer 1 — ambiguous (must → AMBIGUOUS, routed to Layer 2)
// =============================================================================
const AMBIGUOUS_CASES = [
  '지금 시장 어때?',
  '오늘 macro 어때?',
  '위험한 시기야?',
  '삼성전자 괜찮아 보여?',
  '요즘 반도체 분위기 어떤가?',
  '엔비디아 어떻게 생각해?',
  '시장 분위기 알려줘',
  '코스피 요즘 어떤 상황이야?',
  '반도체 섹터 전망이 궁금해',
  '환율 지금 좀 불안한데',
  '테슬라 요즘 분위기?',
  '오늘 장 어땠어?',
];

describe('Layer 1 — advisory detection', () => {
  it.each(ADVISORY_CASES)('CLEAR_BLOCK: %s', (msg) => {
    expect(classifyLayer1(msg)).toBe('CLEAR_BLOCK');
  });
});

describe('Layer 1 — informational pass-through', () => {
  it.each(INFORMATIONAL_CASES)('CLEAR_PASS: %s', (msg) => {
    expect(classifyLayer1(msg)).toBe('CLEAR_PASS');
  });
});

describe('Layer 1 — ambiguous routing', () => {
  it.each(AMBIGUOUS_CASES)('AMBIGUOUS: %s', (msg) => {
    expect(classifyLayer1(msg)).toBe('AMBIGUOUS');
  });
});

// =============================================================================
// Layer 2 + orchestration (mock Anthropic client)
// =============================================================================
function mockClient(returns: string) {
  const create = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: returns }],
  });
  return { client: { messages: { create } } as ClassifierClient, create };
}

describe('classifyLayer2', () => {
  it.each<[string, Layer2Category]>([
    ['ADVISORY_REQUEST', 'ADVISORY_REQUEST'],
    ['INFORMATIONAL', 'INFORMATIONAL'],
    ['OUT_OF_SCOPE', 'OUT_OF_SCOPE'],
    ['  informational  ', 'INFORMATIONAL'],
  ])('parses %s', async (raw, expected) => {
    const { client } = mockClient(raw);
    expect(await classifyLayer2('지금 시장 어때?', client)).toBe(expected);
  });

  it('fails closed (ADVISORY_REQUEST) on unparseable output', async () => {
    const { client } = mockClient('banana');
    expect(await classifyLayer2('지금 시장 어때?', client)).toBe('ADVISORY_REQUEST');
  });

  it('fails closed (ADVISORY_REQUEST) when the API throws', async () => {
    const create = vi.fn().mockRejectedValue(new Error('network'));
    const client = { messages: { create } } as ClassifierClient;
    expect(await classifyLayer2('지금 시장 어때?', client)).toBe('ADVISORY_REQUEST');
  });
});

describe('applySafetyFilter — Layer 1 short-circuits (Layer 2 not called)', () => {
  it('advisory → BLOCK without calling Layer 2', async () => {
    const { client, create } = mockClient('INFORMATIONAL');
    const r = await applySafetyFilter('지금 매수해야 할까?', client);
    expect(r.decision).toBe('BLOCK');
    expect(r.category).toBe('ADVISORY_REQUEST');
    expect(r.layer1).toBe('CLEAR_BLOCK');
    expect(r.layer2).toBeNull();
    expect(r.redirectText).toBe(COHORT_FALLBACK_REDIRECT);
    expect(create).not.toHaveBeenCalled();
  });

  it('informational → ALLOW without calling Layer 2', async () => {
    const { client, create } = mockClient('ADVISORY_REQUEST');
    const r = await applySafetyFilter('VIX는 뭐야?', client);
    expect(r.decision).toBe('ALLOW');
    expect(r.category).toBe('INFORMATIONAL');
    expect(r.layer1).toBe('CLEAR_PASS');
    expect(r.redirectText).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });
});

describe('applySafetyFilter — ambiguous routes to Layer 2', () => {
  it('ambiguous + Layer 2 ADVISORY_REQUEST → BLOCK', async () => {
    const { client, create } = mockClient('ADVISORY_REQUEST');
    const r = await applySafetyFilter('지금 시장 어때?', client);
    expect(r.decision).toBe('BLOCK');
    expect(r.layer1).toBe('AMBIGUOUS');
    expect(r.layer2).toBe('ADVISORY_REQUEST');
    expect(r.redirectText).toBe(COHORT_FALLBACK_REDIRECT);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('ambiguous + Layer 2 INFORMATIONAL → ALLOW', async () => {
    const { client, create } = mockClient('INFORMATIONAL');
    const r = await applySafetyFilter('오늘 macro 어때?', client);
    expect(r.decision).toBe('ALLOW');
    expect(r.layer1).toBe('AMBIGUOUS');
    expect(r.layer2).toBe('INFORMATIONAL');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('ambiguous + Layer 2 OUT_OF_SCOPE → ALLOW', async () => {
    const { client } = mockClient('OUT_OF_SCOPE');
    const r = await applySafetyFilter('오늘 점심 뭐 먹지?', client);
    expect(r.decision).toBe('ALLOW');
    expect(r.category).toBe('OUT_OF_SCOPE');
  });
});

describe('output-side guard', () => {
  it('flags leaked advisory phrasing', () => {
    expect(containsForbiddenOutput('지금 삼성전자 매수하세요')).toBe(true);
    expect(containsForbiddenOutput('지금이 기회입니다')).toBe(true);
  });
  it('passes companion framing', () => {
    expect(
      containsForbiddenOutput('본인 plan을 같이 점검해볼까요? 잠시 호흡해요.'),
    ).toBe(false);
  });
});
