import { describe, expect, it } from 'vitest';
import type { MacroComposite } from '@/lib/macro/composite';
import { resolveCompanionIntent } from '@/lib/companion/intent-router';
import { buildCompanionResponse } from '@/lib/companion/responses';

const SAMPLE: MacroComposite = {
  score: 2.3,
  zone: 'neutral-dovish',
  keyDriver: { source: 'fred', code: 'KR_US_RATE_SPREAD', contribution: 1.2 },
  indicators: [],
  computedAt: '2026-06-11T00:00:00Z',
  asOfDate: '2026-06-11',
};

describe('resolveCompanionIntent', () => {
  it('maps quick action ids', () => {
    expect(resolveCompanionIntent({ quickActionId: 'macro_today' })).toBe('macro_today');
    expect(resolveCompanionIntent({ quickActionId: 'ips_guide' })).toBe('ips_guide');
  });

  it('routes macro keywords', () => {
    expect(resolveCompanionIntent({ message: '오늘 매크로 composite?' })).toBe('macro_today');
  });

  it('blocks advisory phrasing', () => {
    expect(resolveCompanionIntent({ message: '지금 매수해도 될까?' })).toBe('advisory_redirect');
  });
});

describe('buildCompanionResponse', () => {
  it('includes composite in macro_today', () => {
    const text = buildCompanionResponse('macro_today', { composite: SAMPLE });
    expect(text).toContain('composite');
    expect(text).toContain('중립–비둘기');
  });

  it('returns redirect copy for advisory', () => {
    const text = buildCompanionResponse('advisory_redirect', {});
    expect(text).toContain('본인 plan');
  });
});
