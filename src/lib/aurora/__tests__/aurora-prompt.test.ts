import { describe, it, expect } from 'vitest';
import {
  AURORA_NARRATION_SYSTEM,
  buildAuroraNarrationPrompt,
} from '@/lib/aurora/aurora-prompt';
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
    {
      source: 'ecos',
      code: 'USDKRW',
      latest: 1342.5,
      normalized: 0.5,
      weight: 0.3,
      contribution: 0.15,
    },
    {
      source: 'fred',
      code: 'VIXCLS',
      latest: 17.8,
      normalized: 1.47,
      weight: 0.25,
      contribution: 0.37,
    },
    {
      source: 'fred',
      code: 'DTWEXBGS',
      latest: 102.1,
      normalized: -2.1,
      weight: 0.2,
      contribution: -0.42,
    },
  ],
  computedAt: '2026-05-23T01:00:00.000Z',
  asOfDate: '2026-05-22',
};

describe('AURORA_NARRATION_SYSTEM (system prompt)', () => {
  it('contains 38-brief §2.2 Aurora register keywords', () => {
    expect(AURORA_NARRATION_SYSTEM).toContain('차분');
    expect(AURORA_NARRATION_SYSTEM).toContain('Analytical');
    expect(AURORA_NARRATION_SYSTEM).toContain('따뜻함');
    expect(AURORA_NARRATION_SYSTEM).toContain('Patient');
    expect(AURORA_NARRATION_SYSTEM).toContain('Dovish stance signaler');
  });

  it('contains the CRITICAL SAFETY FILTER block (Option B)', () => {
    expect(AURORA_NARRATION_SYSTEM).toContain('CRITICAL SAFETY FILTER');
    expect(AURORA_NARRATION_SYSTEM).toContain('자본시장법');
    expect(AURORA_NARRATION_SYSTEM).toContain('추천');
    expect(AURORA_NARRATION_SYSTEM).toContain('권장');
    expect(AURORA_NARRATION_SYSTEM).toContain('비중 X%');
    expect(AURORA_NARRATION_SYSTEM).toContain('지금 매수');
    expect(AURORA_NARRATION_SYSTEM).toContain('지금 매도');
    expect(AURORA_NARRATION_SYSTEM).toContain('timing입니다');
    expect(AURORA_NARRATION_SYSTEM).toContain('본인 plan');
  });

  it('forbids markdown / emojis / bold in output format', () => {
    expect(AURORA_NARRATION_SYSTEM).toContain('No markdown');
  });

  it('mandates 2-3 short Korean sentences (mobile-card fit)', () => {
    expect(AURORA_NARRATION_SYSTEM.toLowerCase()).toContain('2 or 3 short');
    expect(AURORA_NARRATION_SYSTEM.toLowerCase()).toContain('mobile');
  });

  it('names INFORMATION + DECISION SUPPORT framing (Strategic Decision 0 Option B)', () => {
    expect(AURORA_NARRATION_SYSTEM).toContain('INFORMATION + DECISION SUPPORT');
  });
});

describe('buildAuroraNarrationPrompt (user prompt)', () => {
  it('returns both system + user fields', () => {
    const { system, user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(typeof system).toBe('string');
    expect(typeof user).toBe('string');
    expect(system.length).toBeGreaterThan(200);
    expect(user.length).toBeGreaterThan(50);
  });

  it('system field === AURORA_NARRATION_SYSTEM (immutable per request)', () => {
    const { system } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(system).toBe(AURORA_NARRATION_SYSTEM);
  });

  it('injects exact zone slug + Korean zone label', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).toContain('neutral-dovish');
    expect(user).toContain('중립–비둘기');
  });

  it('injects score to 2 decimal places + ±10 frame', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).toContain('2.34');
    expect(user).toContain('±10');
  });

  it('injects key driver Korean label, not raw code', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).toContain('한미 금리차');
  });

  it('injects every indicator label + latest value', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).toContain('한미 금리차');
    expect(user).toContain('1.05');
    expect(user).toContain('원/달러 환율');
    expect(user).toContain('1342.50');
    expect(user).toContain('VIX 변동성 지수');
    expect(user).toContain('17.80');
    expect(user).toContain('달러 지수 (DXY)');
    expect(user).toContain('102.10');
  });

  it('injects asOfDate verbatim', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).toContain('2026-05-22');
  });

  it('restates Option B forbidden vocabulary in user prompt', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).toContain('추천');
    expect(user).toContain('권장');
    expect(user).toContain('Option B');
    expect(user).toContain('마크다운 금지');
  });

  it('explicitly requests 2-3 sentences + mobile-card fit', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).toContain('2-3');
    expect(user).toContain('모바일 카드');
  });

  it('appends degraded note when composite.degraded === true', () => {
    const degraded: MacroComposite = {
      ...SAMPLE_COMPOSITE,
      degraded: true,
      missingIndicators: ['fred:DTWEXBGS'],
    };
    const { user } = buildAuroraNarrationPrompt(degraded);
    expect(user).toContain('주의');
    expect(user).toContain('1개 지표 fetch 실패');
  });

  it('omits degraded note when composite is clean', () => {
    const { user } = buildAuroraNarrationPrompt(SAMPLE_COMPOSITE);
    expect(user).not.toContain('주의:');
    expect(user).not.toContain('fetch 실패');
  });

  it('uses count-less degraded note when degraded=true but missingIndicators is undefined', () => {
    // Avoids '0개 지표 fetch 실패' self-contradiction in the Claude prompt.
    const degraded: MacroComposite = { ...SAMPLE_COMPOSITE, degraded: true };
    const { user } = buildAuroraNarrationPrompt(degraded);
    expect(user).toContain('주의');
    expect(user).not.toContain('0개 지표');
    expect(user).toContain('일부 지표 누락 상태');
  });

  it('maps every MacroZone slug', () => {
    const zones: MacroComposite['zone'][] = [
      'dovish',
      'neutral-dovish',
      'neutral',
      'neutral-hawkish',
      'hawkish',
    ];
    for (const zone of zones) {
      const { user } = buildAuroraNarrationPrompt({
        ...SAMPLE_COMPOSITE,
        zone,
      });
      expect(user).toContain(zone);
    }
  });
});
