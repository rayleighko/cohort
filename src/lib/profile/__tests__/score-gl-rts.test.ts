import { describe, expect, it } from 'vitest';

import type { GlRtsAnswers } from '../gl-rts-questions';
import { GlRtsScoreError, scoreGlRts } from '../score-gl-rts';

/** All 13 questions answered — helper for Green implementation. */
function fullAnswers(overrides: Partial<GlRtsAnswers> = {}): GlRtsAnswers {
  return {
    q1: 'b',
    q2: 'b',
    q3: 'b',
    q4: 'b',
    q5: 'b',
    q6: 'b',
    q7: 'b',
    q8: 'b',
    q9: 'a',
    q10: 'a',
    q11: 'b',
    q12: 'b',
    q13: 'b',
    ...overrides,
  };
}

describe('scoreGlRts — GL-RTS composite (Task 5 Red)', () => {
  describe('range boundaries (Kuzniak et al. 2015: 13–47)', () => {
    it('minimum risk profile → 13', () => {
      const answers = fullAnswers({
        q1: 'd', // 1
        q2: 'a', // 1
        q3: 'a', // 1
        q4: 'a', // 1
        q5: 'a', // 1
        q6: 'a', // 1
        q7: 'a', // 1
        q8: 'a', // 1
        q9: 'a', // 1
        q10: 'a', // 1
        q11: 'a', // 1
        q12: 'a', // 1
        q13: 'a', // 1
      });
      expect(scoreGlRts(answers)).toBe(13);
    });

    it('maximum risk profile → 47', () => {
      const answers = fullAnswers({
        q1: 'a', // 4
        q2: 'd', // 4
        q3: 'd', // 4
        q4: 'c', // 3
        q5: 'c', // 3
        q6: 'd', // 4
        q7: 'd', // 4
        q8: 'd', // 4
        q9: 'b', // 3
        q10: 'b', // 3
        q11: 'd', // 4
        q12: 'c', // 3
        q13: 'd', // 4
      });
      expect(scoreGlRts(answers)).toBe(47);
    });
  });

  describe('per-item scoring key (gl-rts-13-korean.md SoT)', () => {
    it('Q1: friend descriptor — a=4, d=1', () => {
      const base = fullAnswers();
      expect(scoreGlRts({ ...base, q1: 'a' }) - scoreGlRts({ ...base, q1: 'd' })).toBe(3);
    });

    it('Q2: game show gamble — a=1, d=4', () => {
      const base = fullAnswers();
      expect(scoreGlRts({ ...base, q2: 'd' }) - scoreGlRts({ ...base, q2: 'a' })).toBe(3);
    });

    it('Q4: windfall allocation — 3-option scale max 3', () => {
      const base = fullAnswers();
      expect(scoreGlRts({ ...base, q4: 'c' }) - scoreGlRts({ ...base, q4: 'a' })).toBe(2);
    });

    it('Q9·Q10: summed separately (not averaged) — gain a + loss b = 4', () => {
      const base = fullAnswers({ q9: 'a', q10: 'b' });
      const bothMin = fullAnswers({ q9: 'a', q10: 'a' });
      expect(scoreGlRts(base) - scoreGlRts(bothMin)).toBe(2);
    });

    it('Q12: portfolio mix c=3 — handout D=4 typo must not apply', () => {
      const base = fullAnswers({ q12: 'a' });
      expect(scoreGlRts({ ...base, q12: 'c' }) - scoreGlRts({ ...base, q12: 'a' })).toBe(2);
      // If c were wrongly scored as 4, delta would be 3
      expect(scoreGlRts({ ...base, q12: 'c' }) - scoreGlRts({ ...base, q12: 'b' })).toBe(1);
    });

    it('Q13: speculative venture — d=4 vs a=1', () => {
      const base = fullAnswers();
      expect(scoreGlRts({ ...base, q13: 'd' }) - scoreGlRts({ ...base, q13: 'a' })).toBe(3);
    });
  });

  describe('reference profiles', () => {
    it('all middle options (neutral self-report) → 26', () => {
      // q1 b=3, q2 b=2, q3 b=2, q4 b=2, q5 b=2, q6 b=2, q7 b=2, q8 b=2
      // q9 a=1, q10 a=1, q11 b=2, q12 b=2, q13 b=2 → 3+2*10+1+1 = 26
      expect(scoreGlRts(fullAnswers())).toBe(26);
    });

    it('classic loss-aversion pair: q9=a(1), q10=b(3) on otherwise neutral base', () => {
      const lossAverse = fullAnswers({ q9: 'a', q10: 'b' });
      const neutral = fullAnswers({ q9: 'a', q10: 'a' });
      expect(scoreGlRts(lossAverse) - scoreGlRts(neutral)).toBe(2);
    });

    it('US population mean ~27.53 is reachable (sanity, not exact replication)', () => {
      const nearMean = fullAnswers({
        q1: 'b',
        q2: 'c',
        q3: 'b',
        q4: 'b',
        q5: 'b',
        q6: 'c',
        q7: 'b',
        q8: 'c',
        q9: 'a',
        q10: 'b',
        q11: 'b',
        q12: 'b',
        q13: 'b',
      });
      const score = scoreGlRts(nearMean);
      expect(score).toBeGreaterThanOrEqual(23);
      expect(score).toBeLessThanOrEqual(32);
    });
  });

  describe('input validation (Green: discriminate error codes)', () => {
    it('missing question → GlRtsScoreError', () => {
      const { q13: _drop, ...incomplete } = fullAnswers();
      expect(() => scoreGlRts(incomplete)).toThrow(GlRtsScoreError);
    });

    it('empty object → GlRtsScoreError', () => {
      expect(() => scoreGlRts({})).toThrow(GlRtsScoreError);
    });

    it('invalid option id for question → GlRtsScoreError', () => {
      expect(() =>
        scoreGlRts(fullAnswers({ q4: 'd' as 'a' })),
      ).toThrow(GlRtsScoreError);
      expect(() =>
        scoreGlRts(fullAnswers({ q9: 'c' as 'a' })),
      ).toThrow(GlRtsScoreError);
    });

    it('Q9/Q10 only accept a|b — c or d rejected', () => {
      expect(() => scoreGlRts(fullAnswers({ q10: 'd' as 'a' }))).toThrow(
        GlRtsScoreError,
      );
    });

    it.todo('incomplete vs invalid error codes (Green implementation)');
  });
});
