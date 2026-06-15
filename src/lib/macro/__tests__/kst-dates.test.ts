import { describe, expect, it } from 'vitest';

import { kstDaysAgoIso, kstTodayIso } from '../kst-dates';

describe('kst-dates', () => {
  it('kstTodayIso returns YYYY-MM-DD', () => {
    expect(kstTodayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('kstDaysAgoIso(7) is before kstTodayIso', () => {
    expect(kstDaysAgoIso(7) < kstTodayIso()).toBe(true);
  });
});
