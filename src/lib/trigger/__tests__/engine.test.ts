import { describe, expect, it } from 'vitest';
import { evaluateTrigger } from '../engine';
import type { ShapeCTrigger, TriggerEvaluationContext } from '@/types/trigger';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = new Date('2026-05-26T10:00:00Z');

function makeBaseTrigger(overrides: Partial<ShapeCTrigger> = {}): ShapeCTrigger {
  return {
    id: 'trigger-uuid-1',
    user_id: 'user-uuid-1',
    trigger_type: 'price_drop',
    condition_params: { ticker: 'AAPL', threshold_pct: 10, window_hours: 24 },
    cooldown_hours: 24,
    last_fired_at: null,
    is_active: true,
    label: null,
    created_at: '2026-05-25T00:00:00Z',
    updated_at: '2026-05-25T00:00:00Z',
    ...overrides,
  };
}

// ── is_active gate ─────────────────────────────────────────────────────────────

describe('evaluateTrigger — is_active gate', () => {
  it('inactive trigger → fired: false', () => {
    const trigger = makeBaseTrigger({ is_active: false });
    const ctx: TriggerEvaluationContext = {
      prices: { AAPL: 0.8 },
      evaluatedAt: NOW,
    };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
    expect(result.triggerId).toBe('trigger-uuid-1');
    expect(result.evaluatedAt).toEqual(NOW);
  });
});

// ── Cooldown gate ──────────────────────────────────────────────────────────────

describe('evaluateTrigger — cooldown gate', () => {
  it('within cooldown window → fired: false', () => {
    const recent = new Date(NOW.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const trigger = makeBaseTrigger({ last_fired_at: recent, cooldown_hours: 24 });
    const ctx: TriggerEvaluationContext = {
      prices: { AAPL: 0.5 },
      evaluatedAt: NOW,
    };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });

  it('past cooldown window → evaluation proceeds', () => {
    const old = new Date(NOW.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const trigger = makeBaseTrigger({
      last_fired_at: old,
      cooldown_hours: 24,
      condition_params: { ticker: 'AAPL', threshold_pct: 10, window_hours: 24 },
    });
    // price <= 1 - 0.10 = 0.90 → fires
    const ctx: TriggerEvaluationContext = { prices: { AAPL: 0.8 }, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(true);
  });
});

// ── price_drop ─────────────────────────────────────────────────────────────────

describe('evaluateTrigger — price_drop', () => {
  it('missing ticker price → fired: false', () => {
    const trigger = makeBaseTrigger({
      condition_params: { ticker: 'TSLA', threshold_pct: 5, window_hours: 24 },
    });
    const ctx: TriggerEvaluationContext = { prices: { AAPL: 100 }, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });

  it('missing prices context entirely → fired: false', () => {
    const trigger = makeBaseTrigger();
    const ctx: TriggerEvaluationContext = { evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });

  it('price above threshold → fired: false (no drop)', () => {
    const trigger = makeBaseTrigger({
      condition_params: { ticker: 'AAPL', threshold_pct: 10, window_hours: 24 },
    });
    // currentPrice 0.95 > (1 - 0.10) = 0.90 → not fired
    const ctx: TriggerEvaluationContext = { prices: { AAPL: 0.95 }, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });

  it('price equals threshold boundary → fired (<=)', () => {
    const trigger = makeBaseTrigger({
      condition_params: { ticker: 'AAPL', threshold_pct: 10, window_hours: 24 },
    });
    // 1 - 0.10 = 0.90; currentPrice 0.90 <= 0.90 → fires
    const ctx: TriggerEvaluationContext = { prices: { AAPL: 0.9 }, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(true);
  });

  it('price below threshold → fired: true, reason Option B compliant', () => {
    const trigger = makeBaseTrigger({
      condition_params: { ticker: 'AAPL', threshold_pct: 10, window_hours: 24 },
    });
    const ctx: TriggerEvaluationContext = { prices: { AAPL: 0.8 }, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(true);
    expect(result.triggerType).toBe('price_drop');
    // Option B: contains ticker + 하락 + 점검 — NO timing/buy advice
    expect(result.reason).toContain('AAPL');
    expect(result.reason).toContain('하락');
    expect(result.reason).toContain('점검');
    expect(result.reason).not.toContain('매수');
    expect(result.reason).not.toContain('timing');
    expect(result.reason).not.toContain('비중');
  });

  it('zero threshold_pct → fired: false (sentinel guard)', () => {
    const trigger = makeBaseTrigger({
      condition_params: { ticker: 'AAPL', threshold_pct: 0, window_hours: 24 },
    });
    const ctx: TriggerEvaluationContext = { prices: { AAPL: 0 }, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });
});

// ── macro_composite ────────────────────────────────────────────────────────────

describe('evaluateTrigger — macro_composite', () => {
  it('missing macroCompositeScore → fired: false', () => {
    const trigger = makeBaseTrigger({
      trigger_type: 'macro_composite',
      condition_params: { direction: 'above', threshold: 60 },
    });
    const ctx: TriggerEvaluationContext = { evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });

  it('direction=above, score > threshold → fired: true', () => {
    const trigger = makeBaseTrigger({
      trigger_type: 'macro_composite',
      condition_params: { direction: 'above', threshold: 60 },
    });
    const ctx: TriggerEvaluationContext = { macroCompositeScore: 70, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(true);
    expect(result.reason).toContain('>');
    expect(result.reason).toContain('60');
    expect(result.reason).not.toContain('매수');
  });

  it('direction=above, score === threshold → fired: false (strict >)', () => {
    const trigger = makeBaseTrigger({
      trigger_type: 'macro_composite',
      condition_params: { direction: 'above', threshold: 60 },
    });
    const ctx: TriggerEvaluationContext = { macroCompositeScore: 60, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });

  it('direction=below, score < threshold → fired: true', () => {
    const trigger = makeBaseTrigger({
      trigger_type: 'macro_composite',
      condition_params: { direction: 'below', threshold: 40 },
    });
    const ctx: TriggerEvaluationContext = { macroCompositeScore: 30, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(true);
    expect(result.reason).toContain('<');
    expect(result.reason).toContain('40');
  });

  it('direction=below, score > threshold → fired: false', () => {
    const trigger = makeBaseTrigger({
      trigger_type: 'macro_composite',
      condition_params: { direction: 'below', threshold: 40 },
    });
    const ctx: TriggerEvaluationContext = { macroCompositeScore: 50, evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });
});

// ── V1.5 deferred types ────────────────────────────────────────────────────────

describe('evaluateTrigger — V1.5 deferred (disclosure + composite)', () => {
  it('disclosure trigger → fired: false (deferred)', () => {
    const trigger = makeBaseTrigger({
      trigger_type: 'disclosure',
      condition_params: { ticker: 'TSLA', disclosure_type: 'SEC_13F' },
    });
    const ctx: TriggerEvaluationContext = { evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });

  it('composite trigger → fired: false (deferred)', () => {
    const trigger = makeBaseTrigger({
      trigger_type: 'composite',
      condition_params: { operator: 'AND', sub_trigger_ids: ['t1', 't2'] },
    });
    const ctx: TriggerEvaluationContext = { evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.fired).toBe(false);
  });
});

// ── evaluatedAt propagation ────────────────────────────────────────────────────

describe('evaluateTrigger — evaluatedAt propagation', () => {
  it('ctx.evaluatedAt propagated to result', () => {
    const trigger = makeBaseTrigger({ is_active: false });
    const ctx: TriggerEvaluationContext = { evaluatedAt: NOW };
    const result = evaluateTrigger(trigger, ctx);
    expect(result.evaluatedAt).toEqual(NOW);
  });

  it('omitted evaluatedAt defaults to roughly now', () => {
    const before = new Date();
    const trigger = makeBaseTrigger({ is_active: false });
    const result = evaluateTrigger(trigger, {});
    const after = new Date();
    expect(result.evaluatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.evaluatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
