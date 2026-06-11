/**
 * GL-RTS scoring engine — Task 5 (Ray implements Green).
 *
 * SoT: docs/handoff-20260611/gl-rts-13-korean.md
 * Q9·Q10: summed as separate items (total range 13–47 per Kuzniak et al. 2015).
 * Q12: a=1, b=2, c=3 only — never 4 (handout typo guard).
 */

import type {
  GlRtsAnswers,
  GlRtsOptionId,
  GlRtsQuestionId,
} from './gl-rts-questions';

/**
 * Item-level scoring key — SoT: gl-rts-13-korean.md
 * Q9·Q10: each scored 1|3, summed into total (range 13–47).
 */
export const GL_RTS_ITEM_SCORES: Record<
  GlRtsQuestionId,
  Partial<Record<GlRtsOptionId, number>>
> = {
  q1: { a: 4, b: 3, c: 2, d: 1 },
  q2: { a: 1, b: 2, c: 3, d: 4 },
  q3: { a: 1, b: 2, c: 3, d: 4 },
  q4: { a: 1, b: 2, c: 3 },
  q5: { a: 1, b: 2, c: 3 },
  q6: { a: 1, b: 2, c: 3, d: 4 },
  q7: { a: 1, b: 2, c: 3, d: 4 },
  q8: { a: 1, b: 2, c: 3, d: 4 },
  q9: { a: 1, b: 3 },
  q10: { a: 1, b: 3 },
  q11: { a: 1, b: 2, c: 3, d: 4 },
  q12: { a: 1, b: 2, c: 3 },
  q13: { a: 1, b: 2, c: 3, d: 4 },
};

export const GL_RTS_SCORE_MIN = 13 as const;
export const GL_RTS_SCORE_MAX = 47 as const;

export class GlRtsScoreError extends Error {
  readonly code: 'incomplete' | 'invalid';

  constructor(message: string, code: 'incomplete' | 'invalid') {
    super(message);
    this.name = 'GlRtsScoreError';
    this.code = code;
  }
}

/**
 * Computes the GL-RTS composite score from validated answers.
 * @throws {GlRtsScoreError} when answers are incomplete or contain invalid option ids
 */
export function scoreGlRts(_answers: GlRtsAnswers): number {
  throw new GlRtsScoreError('scoreGlRts not implemented — Task 5 Green', 'incomplete');
}
