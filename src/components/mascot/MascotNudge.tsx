'use client';

import type { MascotCharacter } from '@/types/mascot';

/**
 * MascotNudge — Shape C panic/FOMO behavioral-guard nudge modal.
 * Soft-pause UX: "잠시 멈춰볼까요" + 본인 plan reference + 24h cooldown notice.
 * Never directive. TODO(W4-W5): build nudge modal + cooldown integration.
 */
interface MascotNudgeProps {
  character?: MascotCharacter;
}

export default function MascotNudge(_props: MascotNudgeProps) {
  return null;
}
