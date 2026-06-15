import { describe, it, expect } from 'vitest';
import {
  AURORA_NARRATION_SYSTEM,
  NARRATION_CATEGORIES,
  buildAuroraNarrationPrompt,
  type NarrationCategory,
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
      observationDate: '2026-05-22',
      normalized: 1.6,
      weight: 0.25,
      contribution: 0.4,
    },
    {
      source: 'ecos',
      code: 'USDKRW',
      latest: 1342.5,
      observationDate: '2026-05-22',
      normalized: 0.5,
      weight: 0.3,
      contribution: 0.15,
    },
    {
      source: 'fred',
      code: 'VIXCLS',
      latest: 17.8,
      observationDate: '2026-05-22',
      normalized: 1.47,
      weight: 0.25,
      contribution: 0.37,
    },
    {
      source: 'fred',
      code: 'DTWEXBGS',
      latest: 102.1,
      observationDate: '2026-05-22',
      normalized: -2.1,
      weight: 0.2,
      contribution: -0.42,
    },
  ],
  computedAt: '2026-05-23T01:00:00.000Z',
  asOfDate: '2026-05-22',
};

const YESTERDAY_COMPOSITE: MacroComposite = {
  ...SAMPLE_COMPOSITE,
  score: 1.1,
  zone: 'neutral',
  keyDriver: { source: 'fred', code: 'VIXCLS', contribution: 0.55 },
  asOfDate: '2026-05-21',
  computedAt: '2026-05-22T01:00:00.000Z',
};

function makeHistory(n: number): MacroComposite[] {
  const out: MacroComposite[] = [];
  for (let i = n; i > 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    out.push({
      ...SAMPLE_COMPOSITE,
      score: 1 + Math.sin(i) * 2,
      zone: i % 2 === 0 ? 'neutral-dovish' : 'neutral',
      asOfDate: date,
      computedAt: `${date}T01:00:00.000Z`,
    });
  }
  return out;
}

describe('AURORA_NARRATION_SYSTEM (system prompt — common across all 4 categories)', () => {
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

  it('forbids markdown / bullet lists / emojis / headings in output format', () => {
    expect(AURORA_NARRATION_SYSTEM).toContain('No markdown');
  });

  it('mobile-card fit constraint present', () => {
    expect(AURORA_NARRATION_SYSTEM.toLowerCase()).toContain('mobile');
  });

  it('names INFORMATION + DECISION SUPPORT framing (Strategic Decision 0 Option B)', () => {
    expect(AURORA_NARRATION_SYSTEM).toContain('INFORMATION + DECISION SUPPORT');
  });
});

describe('NARRATION_CATEGORIES', () => {
  it('lists exactly the 4 Day 9 categories', () => {
    expect(NARRATION_CATEGORIES).toEqual([
      'morning_brief',
      'single_indicator_focus',
      'score_change',
      'weekly_summary',
    ]);
  });
});

describe('buildAuroraNarrationPrompt — morning_brief (default, backward compat)', () => {
  it('returns both system + user fields, with system being the common block', () => {
    const { system, user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
    });
    expect(system).toBe(AURORA_NARRATION_SYSTEM);
    expect(user).toContain('[Category: morning_brief]');
    expect(user.length).toBeGreaterThan(50);
  });

  it('defaults category to morning_brief when omitted (Day 7 backward compat)', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
    });
    expect(user).toContain('[Category: morning_brief]');
  });

  it('still produces morning_brief content when explicitly set', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'morning_brief',
    });
    expect(user).toContain('[Category: morning_brief]');
    expect(user).toContain('2-3개 짧은 한국어 문장');
  });

  it('injects zone slug + Korean label + key driver + indicators', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'morning_brief',
    });
    expect(user).toContain('neutral-dovish');
    expect(user).toContain('중립–비둘기');
    expect(user).toContain('2.34');
    expect(user).toContain('±10');
    expect(user).toContain('한미 금리차');
    expect(user).toContain('1.05');
    expect(user).toContain('1342.50');
    expect(user).toContain('17.80');
    expect(user).toContain('102.10');
    expect(user).toContain('2026-05-22');
  });

  it('restates Option B forbidden vocabulary in user prompt', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'morning_brief',
    });
    expect(user).toContain('추천');
    expect(user).toContain('권장');
    expect(user).toContain('Option B');
    expect(user).toContain('마크다운 금지');
  });

  it('appends degraded note when composite.degraded === true', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: { ...SAMPLE_COMPOSITE, degraded: true, missingIndicators: ['fred:DTWEXBGS'] },
    });
    expect(user).toContain('주의');
    expect(user).toContain('1개 지표 fetch 실패');
  });

  it('uses count-less degraded note when missingIndicators undefined', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: { ...SAMPLE_COMPOSITE, degraded: true },
    });
    expect(user).toContain('주의');
    expect(user).not.toContain('0개 지표');
    expect(user).toContain('일부 지표 누락 상태');
  });

  it('omits degraded note when composite is clean', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
    });
    expect(user).not.toContain('주의:');
    expect(user).not.toContain('fetch 실패');
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
        composite: { ...SAMPLE_COMPOSITE, zone },
      });
      expect(user).toContain(zone);
    }
  });
});

describe('buildAuroraNarrationPrompt — single_indicator_focus', () => {
  it('throws when indicator field is missing', () => {
    expect(() =>
      buildAuroraNarrationPrompt({
        composite: SAMPLE_COMPOSITE,
        category: 'single_indicator_focus',
      }),
    ).toThrow(/indicator.*required/i);
  });

  it('produces 2-4 sentence focus narration on the given indicator', () => {
    const indicator = SAMPLE_COMPOSITE.indicators[2]; // VIXCLS
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'single_indicator_focus',
      indicator,
    });
    expect(user).toContain('[Category: single_indicator_focus]');
    expect(user).toContain('VIX 변동성 지수');
    expect(user).toContain('17.80');
    expect(user).toContain('2-4개 짧은 한국어 문장');
  });

  it('includes weight + contribution + normalized for the focal indicator', () => {
    const indicator = SAMPLE_COMPOSITE.indicators[0]; // KR_US_RATE_SPREAD
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'single_indicator_focus',
      indicator,
    });
    expect(user).toContain('25%'); // weight
    expect(user).toContain('0.40'); // contribution
    expect(user).toContain('1.60'); // normalized
  });

  it('includes composite zone context as background', () => {
    const indicator = SAMPLE_COMPOSITE.indicators[0];
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'single_indicator_focus',
      indicator,
    });
    expect(user).toContain('중립–비둘기');
  });

  it('explicitly bans forward-looking predictions', () => {
    const indicator = SAMPLE_COMPOSITE.indicators[0];
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'single_indicator_focus',
      indicator,
    });
    expect(user).toContain('Option B');
    expect(user).toContain('예측하거나');
  });
});

describe('buildAuroraNarrationPrompt — score_change', () => {
  it('throws when yesterday composite is missing', () => {
    expect(() =>
      buildAuroraNarrationPrompt({
        composite: SAMPLE_COMPOSITE,
        category: 'score_change',
      }),
    ).toThrow(/yesterday.*required/i);
  });

  it('produces 2-3 sentence delta narration with sign', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'score_change',
      yesterday: YESTERDAY_COMPOSITE,
    });
    expect(user).toContain('[Category: score_change]');
    expect(user).toContain('2.34');
    expect(user).toContain('1.10');
    expect(user).toContain('+1.24'); // delta sign + magnitude
    expect(user).toContain('2-3개 짧은 한국어 문장');
  });

  it('detects zone transition when zones differ', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'score_change',
      yesterday: YESTERDAY_COMPOSITE,
    });
    expect(user).toContain('zone 전이');
    expect(user).toContain('중립');
    expect(user).toContain('중립–비둘기');
  });

  it('flags zone identity when zones match', () => {
    const sameZoneYesterday: MacroComposite = {
      ...YESTERDAY_COMPOSITE,
      zone: 'neutral-dovish',
    };
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'score_change',
      yesterday: sameZoneYesterday,
    });
    expect(user).toContain('zone 동일');
  });

  it('uses Unicode minus for negative deltas', () => {
    const higherYesterday: MacroComposite = {
      ...YESTERDAY_COMPOSITE,
      score: 5.5,
    };
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'score_change',
      yesterday: higherYesterday,
    });
    expect(user).toContain('−3.16');
  });

  it('explicitly bans timing language (critical for score_change)', () => {
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'score_change',
      yesterday: YESTERDAY_COMPOSITE,
    });
    expect(user).toContain('timing입니다');
    expect(user).toContain('비중 늘려보세요');
    expect(user).toContain('절대 금지');
  });
});

describe('buildAuroraNarrationPrompt — weekly_summary', () => {
  it('throws when history is missing', () => {
    expect(() =>
      buildAuroraNarrationPrompt({
        composite: SAMPLE_COMPOSITE,
        category: 'weekly_summary',
      }),
    ).toThrow(/history.*required/i);
  });

  it('throws when history has fewer than 3 entries', () => {
    expect(() =>
      buildAuroraNarrationPrompt({
        composite: SAMPLE_COMPOSITE,
        category: 'weekly_summary',
        history: makeHistory(2),
      }),
    ).toThrow(/history.*3/i);
  });

  it('produces 3-5 sentence weekly retrospective with ≥3 entries', () => {
    const history = makeHistory(7);
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'weekly_summary',
      history,
    });
    expect(user).toContain('[Category: weekly_summary]');
    expect(user).toContain('3-5개 짧은 한국어 문장');
    expect(user).toContain('최근 7일');
  });

  it('caps history at 14 entries', () => {
    const history = makeHistory(30);
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'weekly_summary',
      history,
    });
    expect(user).toContain('최근 14일');
  });

  it('reports score range + zone set across the window', () => {
    const history = makeHistory(7);
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'weekly_summary',
      history,
    });
    expect(user).toContain('Score 범위');
    expect(user).toContain('Zone 경험');
  });

  it('explicitly bans forward-looking advisory in weekly summary', () => {
    const history = makeHistory(7);
    const { user } = buildAuroraNarrationPrompt({
      composite: SAMPLE_COMPOSITE,
      category: 'weekly_summary',
      history,
    });
    expect(user).toContain('forward-looking advisory');
    expect(user).toContain('retrospective');
  });
});

describe('cross-category invariants', () => {
  it('every category emits the [Category: X] tag in user prompt', () => {
    for (const category of NARRATION_CATEGORIES) {
      const input: Parameters<typeof buildAuroraNarrationPrompt>[0] = {
        composite: SAMPLE_COMPOSITE,
        category: category as NarrationCategory,
      };
      if (category === 'single_indicator_focus') {
        input.indicator = SAMPLE_COMPOSITE.indicators[0];
      } else if (category === 'score_change') {
        input.yesterday = YESTERDAY_COMPOSITE;
      } else if (category === 'weekly_summary') {
        input.history = makeHistory(7);
      }
      const { user } = buildAuroraNarrationPrompt(input);
      expect(user).toContain(`[Category: ${category}]`);
    }
  });

  it('every category restates Option B forbidden vocabulary', () => {
    const cases: Array<Parameters<typeof buildAuroraNarrationPrompt>[0]> = [
      { composite: SAMPLE_COMPOSITE, category: 'morning_brief' },
      {
        composite: SAMPLE_COMPOSITE,
        category: 'single_indicator_focus',
        indicator: SAMPLE_COMPOSITE.indicators[0],
      },
      {
        composite: SAMPLE_COMPOSITE,
        category: 'score_change',
        yesterday: YESTERDAY_COMPOSITE,
      },
      {
        composite: SAMPLE_COMPOSITE,
        category: 'weekly_summary',
        history: makeHistory(7),
      },
    ];
    for (const c of cases) {
      const { user } = buildAuroraNarrationPrompt(c);
      expect(user).toContain('Strategic Decision 0 Option B');
    }
  });

  it('system prompt is identical across all 4 categories (common safety block)', () => {
    const systems = NARRATION_CATEGORIES.map((category) => {
      const input: Parameters<typeof buildAuroraNarrationPrompt>[0] = {
        composite: SAMPLE_COMPOSITE,
        category: category as NarrationCategory,
      };
      if (category === 'single_indicator_focus') {
        input.indicator = SAMPLE_COMPOSITE.indicators[0];
      } else if (category === 'score_change') {
        input.yesterday = YESTERDAY_COMPOSITE;
      } else if (category === 'weekly_summary') {
        input.history = makeHistory(7);
      }
      return buildAuroraNarrationPrompt(input).system;
    });
    for (const s of systems) {
      expect(s).toBe(AURORA_NARRATION_SYSTEM);
    }
  });
});
