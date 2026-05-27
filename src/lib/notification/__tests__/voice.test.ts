import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateBody,
  selectVoice,
  templateCount,
  type TemplateContext,
} from '../voice';
import type { NotificationCategory } from '../types';

describe('selectVoice', () => {
  it('routes trigger_alert to vesper', () => {
    expect(selectVoice({ category: 'trigger_alert' })).toBe('vesper');
  });

  it('routes morning_brief to aurora', () => {
    expect(selectVoice({ category: 'morning_brief' })).toBe('aurora');
  });

  it('routes plan_reference to aurora', () => {
    expect(selectVoice({ category: 'plan_reference' })).toBe('aurora');
  });

  it('routes behavioral_guard to aurora', () => {
    expect(selectVoice({ category: 'behavioral_guard' })).toBe('aurora');
  });

  it('throws on unknown category (exhaustiveness guard)', () => {
    expect(() =>
      selectVoice({ category: 'unknown' as NotificationCategory }),
    ).toThrow();
  });
});

describe('templateCount', () => {
  it('exposes expected pool sizes', () => {
    expect(templateCount('trigger_alert')).toBe(5);
    expect(templateCount('morning_brief')).toBe(3);
    expect(templateCount('plan_reference')).toBe(3);
    expect(templateCount('behavioral_guard')).toBe(3);
  });
});

describe('generateBody — substitution', () => {
  it('substitutes {{score}} to score.toFixed(1)', () => {
    const body = generateBody({
      category: 'trigger_alert',
      voice: 'vesper',
      ctx: { score: -3.2 },
      templateIndex: 0,
    });
    expect(body).toContain('-3.2');
    expect(body).not.toContain('{{score}}');
  });

  it('substitutes {{stance}} literal string', () => {
    const body = generateBody({
      category: 'trigger_alert',
      voice: 'vesper',
      ctx: { score: 1.5, stance: 'dovish' },
      templateIndex: 2,
    });
    expect(body).toContain('dovish');
    expect(body).not.toContain('{{stance}}');
  });

  it('substitutes {{trigger_label}}', () => {
    const body = generateBody({
      category: 'trigger_alert',
      voice: 'vesper',
      ctx: { trigger_label: 'VIX above 25' },
      templateIndex: 1,
    });
    expect(body).toContain('VIX above 25');
    expect(body).not.toContain('{{trigger_label}}');
  });

  it('substitutes {{count}}', () => {
    const body = generateBody({
      category: 'behavioral_guard',
      voice: 'aurora',
      ctx: { count: 3 },
      templateIndex: 0,
    });
    expect(body).toContain('3');
    expect(body).not.toContain('{{count}}');
  });

  it('substitutes {{plan_summary}}', () => {
    const body = generateBody({
      category: 'plan_reference',
      voice: 'aurora',
      ctx: { plan_summary: 'KR 40 / US 50 / cash 10' },
      templateIndex: 0,
    });
    expect(body).toContain('KR 40 / US 50 / cash 10');
    expect(body).not.toContain('{{plan_summary}}');
  });

  it('substitutes missing variables to empty string (no literal leak)', () => {
    const ctx: TemplateContext = {};
    for (const category of [
      'trigger_alert',
      'morning_brief',
      'plan_reference',
      'behavioral_guard',
    ] as const) {
      for (let i = 0; i < templateCount(category); i++) {
        const body = generateBody({
          category,
          voice: selectVoice({ category }),
          ctx,
          templateIndex: i,
        });
        expect(body).not.toMatch(/\{\{[a-z_]+\}\}/);
      }
    }
  });

  it('produces deterministic output for a given templateIndex', () => {
    const a = generateBody({
      category: 'trigger_alert',
      voice: 'vesper',
      ctx: { score: 2.0 },
      templateIndex: 0,
    });
    const b = generateBody({
      category: 'trigger_alert',
      voice: 'vesper',
      ctx: { score: 2.0 },
      templateIndex: 0,
    });
    expect(a).toBe(b);
  });

  it('wraps out-of-range templateIndex into the pool', () => {
    const direct = generateBody({
      category: 'morning_brief',
      voice: 'aurora',
      ctx: { score: 0 },
      templateIndex: 1,
    });
    const wrapped = generateBody({
      category: 'morning_brief',
      voice: 'aurora',
      ctx: { score: 0 },
      templateIndex: 1 + templateCount('morning_brief'),
    });
    expect(direct).toBe(wrapped);
  });
});

describe('generateBody — length warn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns when substituted body exceeds 60 visible chars', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const body = generateBody({
      category: 'plan_reference',
      voice: 'aurora',
      ctx: { plan_summary: 'X'.repeat(80) },
      templateIndex: 0,
    });
    expect(Array.from(body).length).toBeGreaterThan(60);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('exceeds 60 visible chars');
  });

  it('does not warn for short body', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    generateBody({
      category: 'plan_reference',
      voice: 'aurora',
      ctx: { plan_summary: 'short' },
      templateIndex: 0,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
