'use client';

import type { MascotCharacter } from '@/types/mascot';

/**
 * MascotChatBubble — always-accessible in-app chat entry point.
 * TODO(Day 4 / W5): wire to /api/mascot route, render Aurora/Vesper turns,
 * surface safety-filter redirects. Both characters route through the shared
 * 3-layer safety filter (src/lib/claude/safety-filter.ts).
 */
interface MascotChatBubbleProps {
  character?: MascotCharacter;
}

export default function MascotChatBubble(_props: MascotChatBubbleProps) {
  return null;
}
