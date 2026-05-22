/**
 * A/B variant — client helper. Reads the `cohort-ab-variant` cookie set by
 * the Next.js middleware (src/middleware.ts). Day 5b renders Version C
 * regardless; the cookie infra is the W2 A/B-test prerequisite.
 */

export type AbVariant = 'A' | 'B' | 'C';

export const AB_COOKIE = 'cohort-ab-variant';
export const AB_VARIANTS: AbVariant[] = ['A', 'B', 'C'];

/** Reads the assigned variant from the cookie; falls back to 'C'. */
export function getAbVariant(): AbVariant {
  if (typeof document === 'undefined') return 'C';
  const match = document.cookie.match(
    /(?:^|;\s*)cohort-ab-variant=([ABC])(?:;|$)/,
  );
  return (match?.[1] as AbVariant) ?? 'C';
}

/** Returns true if `value` is a valid variant — used for server-side validation. */
export function isAbVariant(value: unknown): value is AbVariant {
  return value === 'A' || value === 'B' || value === 'C';
}
