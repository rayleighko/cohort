import {
  GL_RTS_QUESTIONS,
  type GlRtsAnswers,
  type GlRtsOptionId,
  type GlRtsQuestionId,
} from './gl-rts-questions';

const VALID_OPTION_IDS: GlRtsOptionId[] = ['a', 'b', 'c', 'd'];

function isGlRtsOptionId(v: unknown): v is GlRtsOptionId {
  return typeof v === 'string' && VALID_OPTION_IDS.includes(v as GlRtsOptionId);
}

/**
 * Validates a complete GL-RTS response object (all 13 questions required).
 * Returns normalized answers or null if incomplete/invalid.
 */
export function validateGlRtsAnswers(raw: unknown): GlRtsAnswers | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const out: GlRtsAnswers = {};
  const record = raw as Record<string, unknown>;

  for (const question of GL_RTS_QUESTIONS) {
    const value = record[question.id];
    if (!isGlRtsOptionId(value)) return null;
    if (!question.options.some((o) => o.id === value)) return null;
    out[question.id as GlRtsQuestionId] = value;
  }

  return out;
}
