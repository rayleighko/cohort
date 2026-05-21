import type { MascotCharacter } from '@/types/mascot';

/**
 * MascotNarration — inline narration text from Aurora or Vesper.
 * Aurora narrates morning brief / behavioral guard / plan reference.
 * Vesper narrates trigger alert / market signal / end-of-day review.
 * TODO(W2): template-based narration; TODO(W3+): Claude-generated via /api/mascot.
 */
interface MascotNarrationProps {
  character: MascotCharacter;
  text?: string;
}

export default function MascotNarration(_props: MascotNarrationProps) {
  return null;
}
