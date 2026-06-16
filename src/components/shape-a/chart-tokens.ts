/**
 * Recharts stroke/fill literals — Tailwind classes are not supported on SVG
 * primitives. Values mirror tailwind.config.ts cohort.ink-* + cohort.primary
 * (42 §6.2 raw value authority).
 */
export const CHART_STROKE = '#404040'; // cohort.ink-70
export const CHART_GRID = '#E0E0E0'; // cohort.ink-10
export const CHART_AXIS = '#7A7A7A'; // cohort.ink-50
export const CHART_PRIMARY = '#A8243F'; // cohort.primary — latest point accent

/** @deprecated use CHART_STROKE — kept for existing tests */
export const SPARKLINE_STROKE = CHART_STROKE;
