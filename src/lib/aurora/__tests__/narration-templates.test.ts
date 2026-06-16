import { describe, expect, it } from 'vitest';
import { buildMorningBriefTemplate } from '@/lib/aurora/narration-templates';
import type { MacroComposite } from '@/lib/macro/composite';

const SAMPLE: MacroComposite = {
  score: 2.34,
  zone: 'neutral-dovish',
  keyDriver: { source: 'fred', code: 'KR_US_RATE_SPREAD', contribution: 1.42 },
  indicators: [],
  computedAt: '2026-06-11T00:00:00Z',
  asOfDate: '2026-06-11',
};

describe('buildMorningBriefTemplate', () => {
  it('returns Korean brief with zone and driver', () => {
    const text = buildMorningBriefTemplate(SAMPLE);
    expect(text).toContain('오늘 cohort');
    expect(text).toContain('중립–비둘기');
    expect(text).toContain('한미 금리차');
    expect(text).not.toMatch(/추천|권장|매수하세요/);
  });
});
