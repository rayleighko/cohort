import { describe, expect, it } from 'vitest';
import {
  QUOTA_EXCEEDED_REDIRECT_KO,
  QUOTA_WARN_THRESHOLD,
  resolveUserTier,
  TIER_QUOTAS,
  tomorrowMidnightKstIso,
} from '@/lib/aurora/chat-quota';

describe('TIER_QUOTAS — vault 62 §1 Q3 lock-in (CEO confirm 2026-05-25)', () => {
  it('Tier 0 anonymous: 5 msg/day, 100 msg/month', () => {
    expect(TIER_QUOTAS.tier_0).toEqual({ daily: 5, monthly: 100 });
  });

  it('Tier 1 free signup: 20 msg/day, 400 msg/month', () => {
    expect(TIER_QUOTAS.tier_1).toEqual({ daily: 20, monthly: 400 });
  });

  it('Tier 2 Pro: 100 msg/day, 2000 msg/month', () => {
    expect(TIER_QUOTAS.tier_2_pro).toEqual({ daily: 100, monthly: 2000 });
  });

  it('Tier 3 Premium V1 defer: unlimited (Infinity)', () => {
    expect(TIER_QUOTAS.tier_3_premium.daily).toBe(Number.POSITIVE_INFINITY);
    expect(TIER_QUOTAS.tier_3_premium.monthly).toBe(Number.POSITIVE_INFINITY);
  });

  it('QUOTA_WARN_THRESHOLD = 0.8 (vault 62 §1 Q4)', () => {
    expect(QUOTA_WARN_THRESHOLD).toBe(0.8);
  });
});

describe('resolveUserTier — V1 anonymous chat scaffold', () => {
  it('returns tier_0 for null userId (anonymous)', async () => {
    await expect(resolveUserTier(null)).resolves.toBe('tier_0');
  });

  it('returns tier_1 for any authenticated userId (W5 cascade target)', async () => {
    await expect(resolveUserTier('user-uuid-123')).resolves.toBe('tier_1');
  });
});

describe('tomorrowMidnightKstIso — quota reset boundary', () => {
  it('returns a valid ISO string in the future', () => {
    const iso = tomorrowMidnightKstIso();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now());
  });

  it('aligns with KST midnight (15:00:00.000Z UTC the previous day)', () => {
    const iso = tomorrowMidnightKstIso();
    expect(iso).toMatch(/T15:00:00\.000Z$/);
  });

  it('returns at most ~24 hours in the future from now', () => {
    const now = Date.now();
    const future = new Date(tomorrowMidnightKstIso()).getTime();
    const diffMs = future - now;
    expect(diffMs).toBeGreaterThan(0);
    expect(diffMs).toBeLessThanOrEqual(25 * 60 * 60 * 1000);
  });
});

describe('QUOTA_EXCEEDED_REDIRECT_KO — Aurora voice register', () => {
  it('contains the contract phrases (quota / 본인 plan / 내일)', () => {
    expect(QUOTA_EXCEEDED_REDIRECT_KO).toContain('quota');
    expect(QUOTA_EXCEEDED_REDIRECT_KO).toContain('본인 plan');
    expect(QUOTA_EXCEEDED_REDIRECT_KO).toContain('내일');
  });

  it('does NOT contain advisory triggers (추천 / 권장 / 비중)', () => {
    expect(QUOTA_EXCEEDED_REDIRECT_KO).not.toMatch(/추천|권장|비중/);
  });
});
