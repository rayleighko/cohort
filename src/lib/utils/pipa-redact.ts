/**
 * PIPA — regex redaction of personal / third-party info.
 * Used before any text leaves the user's own scope (e.g. paste flows).
 * TODO(W4-W5): expand patterns; integrate into chat + survey ingestion.
 */

const REDACTION_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: '[전화번호]', pattern: /01[0-9]-?\d{3,4}-?\d{4}/g },
  { label: '[이메일]', pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { label: '[주민번호]', pattern: /\d{6}-?\d{7}/g },
];

/** Replaces detected personal identifiers with neutral labels. */
export function redactPersonalInfo(text: string): string {
  return REDACTION_PATTERNS.reduce(
    (acc, { label, pattern }) => acc.replace(pattern, label),
    text,
  );
}
