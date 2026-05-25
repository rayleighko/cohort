import { describe, it, expect } from 'vitest';
import {
  AURORA_CHAT_SYSTEM,
  MAX_HISTORY_LENGTH,
  buildAuroraChatPrompt,
  type ChatMessage,
} from '@/lib/aurora/chat-prompt';
import type { MacroComposite } from '@/lib/macro/composite';
import type {
  ShapeCTrigger,
  UserInvestmentProfile,
} from '@/types/profile';

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

const SAMPLE_PROFILE: UserInvestmentProfile = {
  userId: '00000000-0000-0000-0000-000000000001',
  experienceTier: 'sophisticated',
  frameworkAffinity: ['drukenmiller_macro', 'kostolany_cycle'],
  riskTolerance: 1,
  timeHorizon: 'long',
  portfolioCompositionPct: { kr_equity: 30, us_equity: 40, bonds: 20, cash: 10 },
  splitBuyEnforcement: 'mostly',
  macroWatchingFreq: 'heavy',
  planFormalization: 'structured',
  emotionalDecisionCount12m: 'few',
  weaknessSelfAssessment: '시장 -5% 하락 시 panic sell 충동',
  paymentWillingnessCeilingKrw: 25000,
  serviceExpectations: ['informational', 'behavioral_guard'],
  infoSources: ['Bloomberg', 'Twitter'],
  clusterBSubClassification: 'B.1.a',
  classificationConfidence: 90,
  frameworkAffinityInferred: ['drukenmiller_macro'],
  createdAt: '2026-05-25T00:00:00.000Z',
  lastUpdatedAt: '2026-05-25T00:00:00.000Z',
};

const SAMPLE_TRIGGERS: ShapeCTrigger[] = [
  {
    id: 'trig-1',
    userId: '00000000-0000-0000-0000-000000000001',
    triggerType: 'price_drop',
    conditionParams: { symbol: 'KOSPI', threshold_pct: -3, window_hours: 1 },
    cooldownHours: 24,
    lastFiredAt: null,
    isActive: true,
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
  },
  {
    id: 'trig-2',
    userId: '00000000-0000-0000-0000-000000000001',
    triggerType: 'macro_composite',
    conditionParams: { zone: 'hawkish', score_threshold: -5 },
    cooldownHours: 48,
    lastFiredAt: '2026-05-23T12:00:00.000Z',
    isActive: true,
    createdAt: '2026-05-20T00:00:00.000Z',
    updatedAt: '2026-05-23T12:00:00.000Z',
  },
  {
    id: 'trig-3-inactive',
    userId: '00000000-0000-0000-0000-000000000001',
    triggerType: 'disclosure',
    conditionParams: { issuer: '삼성전자' },
    cooldownHours: 24,
    lastFiredAt: null,
    isActive: false,
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
  },
];

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

  it('contains FRAMEWORK COACH section (vault 51 §3.1 — profile-aware)', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('FRAMEWORK COACH');
    expect(AURORA_CHAT_SYSTEM).toContain(
      '[참고: 본인 investment profile]',
    );
    expect(AURORA_CHAT_SYSTEM).toContain(
      '[참고: 본인 active Shape C triggers]',
    );
  });

  it('contains framework-matching ALLOWED + cluster calibration cues', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('드러켄밀러식');
    expect(AURORA_CHAT_SYSTEM).toContain('B.1.a Sophisticated Disciplined');
    expect(AURORA_CHAT_SYSTEM).toContain('B.1.b Time-Constrained Emotional');
    expect(AURORA_CHAT_SYSTEM).toContain('B.1.c English-Native Cross-cultural');
    expect(AURORA_CHAT_SYSTEM).toContain('self_discovery');
  });

  it('still forbids 종목+verb / 비중+verb / timing assertion even in framework coach', () => {
    expect(AURORA_CHAT_SYSTEM).toContain('삼성전자 매수하세요');
    expect(AURORA_CHAT_SYSTEM).toContain('30%로 가세요');
    expect(AURORA_CHAT_SYSTEM).toContain('지금 timing입니다');
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

describe('buildAuroraChatPrompt — profile preamble (framework coach context)', () => {
  it('inlines profile preamble when userProfile provided', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '본인 framework이 macro 베팅인데 오늘 reference 어때요?',
      userProfile: SAMPLE_PROFILE,
    });
    const last = out.messages[out.messages.length - 1];
    expect(last.role).toBe('user');
    expect(last.content).toContain('[참고: 본인 investment profile]');
    expect(last.content).toContain('sophisticated');
    expect(last.content).toContain('drukenmiller_macro');
    expect(last.content).toContain('kostolany_cycle');
    expect(last.content).toContain('B.1.a');
    expect(last.content).toContain('structured');
    // % portfolio (no absolute KRW per PIPA strict)
    expect(last.content).toContain('kr_equity');
    expect(last.content).not.toMatch(/[0-9]{6,}/);
    // Weakness self-assessment (Q9) used for behavioral nudge calibration
    expect(last.content).toContain('시장 -5% 하락 시 panic sell');
    // User message body appended after preamble
    expect(last.content).toContain(
      '본인 framework이 macro 베팅인데 오늘 reference 어때요?',
    );
  });

  it('omits profile preamble when userProfile is undefined', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '안녕',
    });
    expect(out.messages[0].content).toBe('안녕');
    expect(out.messages[0].content).not.toContain('investment profile');
  });

  it('only emits fields present on the profile (graceful nulls)', () => {
    const minimal: UserInvestmentProfile = {
      ...SAMPLE_PROFILE,
      experienceTier: null,
      riskTolerance: null,
      timeHorizon: null,
      portfolioCompositionPct: null,
      weaknessSelfAssessment: null,
      frameworkAffinity: [],
    };
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: 'q',
      userProfile: minimal,
    });
    const content = out.messages[0].content;
    expect(content).toContain('[참고: 본인 investment profile]');
    // Present fields:
    expect(content).toContain('B.1.a');
    expect(content).toContain('structured');
    // Absent fields must NOT leak literal 'null':
    expect(content).not.toContain('null');
    expect(content).not.toContain('framework affinity:');
  });
});

describe('buildAuroraChatPrompt — triggers preamble (self-check context)', () => {
  it('inlines active triggers and omits inactive ones', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: 'KOSPI -3% trigger 작동했나요?',
      activeTriggers: SAMPLE_TRIGGERS,
    });
    const content = out.messages[0].content;
    expect(content).toContain('[참고: 본인 active Shape C triggers]');
    expect(content).toContain('price_drop');
    expect(content).toContain('macro_composite');
    expect(content).toContain('cooldown 24h');
    expect(content).toContain('cooldown 48h');
    expect(content).toContain('last fired 2026-05-23');
    expect(content).toContain('not yet fired');
    // Inactive trigger (disclosure on 삼성전자) must NOT leak
    expect(content).not.toContain('disclosure');
    expect(content).not.toContain('삼성전자');
  });

  it('omits triggers preamble when activeTriggers is empty array', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: 'q',
      activeTriggers: [],
    });
    expect(out.messages[0].content).toBe('q');
    expect(out.messages[0].content).not.toContain(
      'active Shape C triggers',
    );
  });

  it('omits triggers preamble when all triggers are inactive', () => {
    const allInactive = SAMPLE_TRIGGERS.map((t) => ({ ...t, isActive: false }));
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: 'q',
      activeTriggers: allInactive,
    });
    expect(out.messages[0].content).toBe('q');
    expect(out.messages[0].content).not.toContain(
      'active Shape C triggers',
    );
  });
});

describe('buildAuroraChatPrompt — combined preambles (order + composability)', () => {
  it('combines profile + triggers + composite in deterministic order', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '오늘 어떻게 봐야 할까요?',
      userProfile: SAMPLE_PROFILE,
      activeTriggers: SAMPLE_TRIGGERS,
      composite: SAMPLE_COMPOSITE,
    });
    const content = out.messages[0].content;
    const profileIdx = content.indexOf('[참고: 본인 investment profile]');
    const triggersIdx = content.indexOf('[참고: 본인 active Shape C triggers]');
    const compositeIdx = content.indexOf('[참고: 오늘의 macro composite');
    const userIdx = content.indexOf('오늘 어떻게 봐야 할까요?');
    expect(profileIdx).toBeGreaterThanOrEqual(0);
    expect(triggersIdx).toBeGreaterThan(profileIdx);
    expect(compositeIdx).toBeGreaterThan(triggersIdx);
    expect(userIdx).toBeGreaterThan(compositeIdx);
  });

  it('handles no-context fallback (no profile, no triggers, no composite)', () => {
    const out = buildAuroraChatPrompt({
      history: [],
      newUserMessage: '안녕하세요',
    });
    expect(out.messages[0].content).toBe('안녕하세요');
    expect(out.messages[0].content).not.toContain('investment profile');
    expect(out.messages[0].content).not.toContain('Shape C triggers');
    expect(out.messages[0].content).not.toContain('macro composite');
  });
});
