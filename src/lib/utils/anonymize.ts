/**
 * PIPA — anonymization helpers for analytics + survey aggregation.
 * TODO(W4): bucketing / generalization so individual users aren't re-identifiable.
 */

/** Buckets a raw allocation percentage into a coarse range label. */
export function bucketPercent(value: number): string {
  if (value <= 0) return '0%';
  if (value < 25) return '1-24%';
  if (value < 50) return '25-49%';
  if (value < 75) return '50-74%';
  return '75-100%';
}
