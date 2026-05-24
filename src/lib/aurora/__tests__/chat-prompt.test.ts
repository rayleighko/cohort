import { describe, it, expect } from 'vitest';
import {
  AURORA_CHAT_SYSTEM,
  MAX_HISTORY_LENGTH,
  buildAuroraChatPrompt,
  type ChatMessage,
} from '@/lib/aurora/chat-prompt';
import type { MacroComposite } from '@/lib/macro/composite';

const SAMPLE_COMPOSITE: MacroComposite = {
  score: 2.34,
  zone: 'neutral-dovish',
  keyDriver: { source: 'fred', code: 'KR_US_RATE_SPREAD', contribution: 1.42 },
  indicators: [
    {
      source: 'fred',
      code: 'KR_US_RATE_SPREAD',
      latest: 1.05,
      normalized: 1.6,
      weight: 0.25,
      contribution: 0.4,
    },
  ],
  computedAt: '2026-05-24T01:00:00.000Z',
  asOfDate: '2026-05-23',
};

describe('AURORA_CHAT_SYSTEM (chat system prompt — Q&A turn-taking register)', () => {
  it('contains 38-brief §2.2 Aurora register keywords', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('차분');
    expect(AURORA_CHAT_SYSTEM).toContain('Analytical');
    expect(AURORA_CHAT_SYSTEM).toContain('따뜻함');
    expect(AURORA_CHAT_SYSTEM).toContain('Patient');
    expect(AURORA_CHAT_SYSTEM).toContain('Dovish');
  });

  it('contains Strategic Decision 0 Option B explicit forbidden 어휘', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('추천');
    expect(AURORA_CHAT_SYSTEM).toContain('권장');
    expect(AURORA_CHAT_SYSTEM).toContain('비중 X%');
    expect(AURORA_CHAT_SYSTEM).toContain('지금 매수');
    expect(AURORA_CHAT_SYSTEM).toContain('지금 매도');
    expect(AURORA_CHAT_SYSTEM).toContain('timing입니다');
    expect(AURORA_CHAT_SYSTEM).toContain('기회입니다');
  });

  it('contains chat-specific verdict-register guard', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('맞아요');
    expect(AURORA_CHAT_SYSTEM).toContain('틀려요');
  });

  it('contains chat-specific advisory question redirects', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('이 종목 어때요?');
    expect(AURORA_CHAT_SYSTEM).toContain('본인 plan 영역 다시 점검해보세요');
  });

  it('contains §14.3 line 707 in-app chat surface integration cue', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('Q&A');
    expect(AURORA_CHAT_SYSTEM).toContain('chat');
  });

  it('contains format contract — mobile-card fit + no markdown headings', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('Mobile-card fit');
    expect(AURORA_CHAT_SYSTEM).toContain('No markdown headings');
    expect(AURORA_CHAT_SYSTEM).toContain('no emojis');
  });

  it('disclaims itself as INFORMATION + DECISION SUPPORT', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('INFORMATION');
    expect(AURORA_CHAT_SYSTEM).toContain('DECISION SUPPORT');
  });
});

describe('buildAuroraChatPrompt — shape', () => {
  it('returns { system, messages } with the AURORA_CHAT_SYSTEM verbatim', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '한미 금리차가 좁혀지면 KOSPI에 어떻게 작용해요?',
    });
    expect(out.system).toBe(AURORA_CHAT_SYSTEM);
  });

  it('appends the new user message as the final message turn', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '한미 금리차 설명 부탁해요',
    });
    expect(out.messages).toHaveLength(1);
    expect(out.messages[0].role).toBe('user');
    expect(out.messages[0].content).toContain('한미 금리차 설명 부탁해요');
  });

  it('preserves history order (oldest → newest) and appends new turn last', () => {
    const history: ChatMessage[] = [
      { role: 'user', text: 'A' },
      { role: 'assistant', text: 'B' },
      { role: 'user', text: 'C' },
      { role: 'assistant', text: 'D' },
    ];
    const out = buildAuroraChatPrompt({
      history,
      newUserMessage: 'E',
    });
    expect(out.messages.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
      'user',
    ]);
    expect(out.messages.map((m) => m.content)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
    ]);
  });
});

describe('buildAuroraChatPrompt — history truncation (last 20 cap)', () => {
  it('trims history to MAX_HISTORY_LENGTH most recent before appending new turn', () => {
    const history: ChatMessage[] = Array.from(
      { length: MAX_HISTORY_LENGTH + 5 },
      (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        text: `m${i}`,
      }),
    );
    const out = buildAuroraChatPrompt({
      history,
      newUserMessage: 'new',
    });
    // 20 trimmed history + 1 new = 21 total
    expect(out.messages).toHaveLength(MAX_HISTORY_LENGTH + 1);
    // First retained should be index 5 (the 5 oldest are trimmed)
    expect(out.messages[0].content).toBe('m5');
    expect(out.messages[MAX_HISTORY_LENGTH - 1].content).toBe(
      `m${MAX_HISTORY_LENGTH + 4}`,
    );
    expect(out.messages[MAX_HISTORY_LENGTH].content).toBe('new');
  });

  it('accepts empty history (first turn case)', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: 'first',
    });
    expect(out.messages).toHaveLength(1);
    expect(out.messages[0]).toEqual({ role: 'user', content: 'first' });
  });
});

describe('buildAuroraChatPrompt — composite preamble', () => {
  it('inlines composite context into the new user message when provided', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '오늘 매크로 어때요?',
      composite: SAMPLE_COMPOSITE,
    });
    const last = out.messages[out.messages.length - 1];
    expect(last.role).toBe('user');
    expect(last.content).toContain('macro composite');
    expect(last.content).toContain('neutral-dovish');
    expect(last.content).toContain('중립–비둘기');
    expect(last.content).toContain('2.34');
    expect(last.content).toContain('KR_US_RATE_SPREAD');
    expect(last.content).toContain('2026-05-23');
    expect(last.content).toContain('오늘 매크로 어때요?');
  });

  it('omits composite preamble when composite is undefined', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '안녕',
    });
    expect(out.messages[0].content).toBe('안녕');
    expect(out.messages[0].content).not.toContain('macro composite');
  });

  it('annotates degraded composite without alarm framing', () => {
    const degraded: MacroComposite = {
      ...SAMPLE_COMPOSITE,
      degraded: true,
      missingIndicators: ['VIXCLS', 'DTWEXBGS'],
    };
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '오늘 어때요?',
      composite: degraded,
    });
    expect(out.messages[0].content).toContain('degraded');
    expect(out.messages[0].content).toContain('2개 지표 누락');
  });

  it('preserves history when composite is also provided (composite only inlined on new turn)', () => {
    const history: ChatMessage[] = [
      { role: 'user', text: 'prior question' },
      { role: 'assistant', text: 'prior answer' },
    ];
    const out = buildAuroraChatPrompt({
      history,
      newUserMessage: '오늘 매크로?',
      composite: SAMPLE_COMPOSITE,
    });
    // History turns must NOT have composite preamble — only the new user turn.
    expect(out.messages[0].content).toBe('prior question');
    expect(out.messages[1].content).toBe('prior answer');
    expect(out.messages[2].content).toContain('macro composite');
  });
});
