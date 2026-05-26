import { describe, expect, it } from 'vitest';
import { enforceCooldown, isInCooldown } from '../cooldown';

const BASE_NOW = new Date('2026-05-26T10:00:00.000Z');

describe('enforceCooldown', () => {
  it('returns no_cooldown_configured when cooldown_minutes is null', () => {
    const result = enforceCooldown({
      trigger: {
        cooldown_minutes: null,
        last_fired_at: '2026-05-26T09:00:00.000Z',
      },
      now: BASE_NOW,
    });

    expect(result).toEqual({
      allowed: true,
      reason: 'no_cooldown_configured',
      remainingMs: null,
      nextEligibleAt: null,
    });
  });

  it('returns no_cooldown_configured when cooldown_minutes is 0', () => {
    const result = enforceCooldown({
      trigger: {
        cooldown_minutes: 0,
        last_fired_at: '2026-05-26T09:00:00.000Z',
      },
      now: BASE_NOW,
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('no_cooldown_configured');
    expect(result.remainingMs).toBeNull();
    expect(result.nextEligibleAt).toBeNull();
  });

  it('returns never_fired when last_fired_at is null', () => {
    const result = enforceCooldown({
      trigger: {
        cooldown_minutes: 10,
        last_fired_at: null,
      },
      now: BASE_NOW,
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('never_fired');
    expect(result.remainingMs).toBeNull();
    expect(result.nextEligibleAt).toBeNull();
  });

  it('returns cooldown_expired when elapsed equals cooldown boundary', () => {
    const result = enforceCooldown({
      trigger: {
        cooldown_minutes: 10,
        last_fired_at: '2026-05-26T09:50:00.000Z',
      },
      now: BASE_NOW,
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('cooldown_expired');
    expect(result.remainingMs).toBeNull();
    expect(result.nextEligibleAt).toBeNull();
  });

  it('returns cooldown_active with remainingMs and nextEligibleAt within window', () => {
    const result = enforceCooldown({
      trigger: {
        cooldown_minutes: 10,
        last_fired_at: '2026-05-26T09:55:00.000Z',
      },
      now: BASE_NOW,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('cooldown_active');
    expect(result.remainingMs).toBe(5 * 60 * 1000);
    expect(result.nextEligibleAt?.toISOString()).toBe('2026-05-26T10:05:00.000Z');
  });

  it('boundary check: 1ms inside window stays active', () => {
    const result = enforceCooldown({
      trigger: {
        cooldown_minutes: 1,
        last_fired_at: '2026-05-26T09:59:00.001Z',
      },
      now: BASE_NOW,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('cooldown_active');
    expect(result.remainingMs).toBe(1);
    expect(result.nextEligibleAt?.toISOString()).toBe('2026-05-26T10:00:00.001Z');
  });

  it('boundary check: 1ms outside window is expired', () => {
    const result = enforceCooldown({
      trigger: {
        cooldown_minutes: 1,
        last_fired_at: '2026-05-26T09:58:59.999Z',
      },
      now: BASE_NOW,
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('cooldown_expired');
    expect(result.remainingMs).toBeNull();
    expect(result.nextEligibleAt).toBeNull();
  });
});

describe('isInCooldown', () => {
  it('returns true within cooldown window', () => {
    const lastFired = new Date('2026-05-26T09:00:00.000Z');
    expect(isInCooldown(lastFired, 2, BASE_NOW)).toBe(true);
  });

  it('returns false after cooldown expires', () => {
    const lastFired = new Date('2026-05-26T07:59:59.000Z');
    expect(isInCooldown(lastFired, 2, BASE_NOW)).toBe(false);
  });
});
