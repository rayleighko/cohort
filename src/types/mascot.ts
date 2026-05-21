/**
 * Cohort dual-mascot domain types.
 * Aurora 🕊 (Dove) — dovish: patient compound, 분할매수 페이스, plan adherence.
 * Vesper 🦅 (Hawk) — hawkish: opportunity sensing, decisive trigger.
 * Both are companions, never directive.
 */

export type MascotCharacter = 'aurora' | 'vesper';

export type MascotState =
  | 'calm'
  | 'alert'
  | 'happy'
  | 'concerned'
  | 'proud'
  | 'reflective';

export const MASCOT_STATES: MascotState[] = [
  'calm',
  'alert',
  'happy',
  'concerned',
  'proud',
  'reflective',
];

/** Display metadata per character. */
export const MASCOT_META: Record<
  MascotCharacter,
  { label: string; emoji: string; animal: string }
> = {
  aurora: { label: 'Aurora', emoji: '🕊', animal: 'dove' },
  vesper: { label: 'Vesper', emoji: '🦅', animal: 'hawk' },
};
