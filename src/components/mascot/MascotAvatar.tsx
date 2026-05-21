import type { MascotCharacter, MascotState } from '@/types/mascot';

/**
 * MascotAvatar — renders Aurora 🕊 (Dove) or Vesper 🦅 (Hawk) in one of
 * 6 dynamic states. Day 1 = inline SVG placeholder (solid disc + bird
 * silhouette). Final illustration art swaps in at W5 (operator, PRE-W5).
 *
 * Aurora = dovish companion (patient compound, plan adherence).
 * Vesper = hawkish companion (opportunity sensing, decisive trigger).
 * Neither is ever directive — both are pace companions.
 */

interface MascotAvatarProps {
  character: MascotCharacter;
  state?: MascotState;
  /** Pixel size of the square avatar. Default 64. */
  size?: number;
  className?: string;
}

// State → fill color, mirrors tailwind.config.ts aurora/vesper palettes.
const PALETTE: Record<MascotCharacter, Record<MascotState, string>> = {
  aurora: {
    calm: '#A8243F',
    alert: '#C8523F',
    happy: '#B8943D',
    concerned: '#8A1A30',
    proud: '#D4B872',
    reflective: '#666666',
  },
  vesper: {
    calm: '#E8A33D',
    alert: '#FF6B35',
    happy: '#FFC857',
    concerned: '#8B4513',
    proud: '#FFD700',
    reflective: '#5C5C5C',
  },
};

// Simple line-art silhouettes within a 256x256 viewBox.
const DOVE =
  'M70 130 C70 100 95 82 128 82 C150 82 165 92 178 78 C172 96 160 104 160 104 ' +
  'C175 108 188 122 188 140 C170 132 156 134 142 142 C128 150 100 152 84 140 ' +
  'C76 134 70 130 70 130 Z';
const HAWK =
  'M60 128 L120 96 L116 116 L160 84 L150 112 L196 96 L168 128 L150 150 ' +
  'L120 138 L92 150 Z';

export default function MascotAvatar({
  character,
  state = 'calm',
  size = 64,
  className,
}: MascotAvatarProps) {
  const fill = PALETTE[character][state];
  const isAurora = character === 'aurora';
  const label = `${isAurora ? 'Aurora' : 'Vesper'} (${state})`;

  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      <circle cx="128" cy="128" r="124" fill={fill} />
      {isAurora ? (
        <>
          <path d={DOVE} fill="#F8F4ED" opacity={0.95} />
          <circle cx="150" cy="100" r="5" fill="#1A1A1A" />
        </>
      ) : (
        <>
          <path d={HAWK} fill="#1A1A1A" opacity={0.9} />
          <circle cx="150" cy="106" r="4.5" fill="#F8F4ED" />
        </>
      )}
    </svg>
  );
}
