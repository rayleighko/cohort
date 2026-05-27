import type { ReactNode } from 'react';
import BottomNav from '@/components/ui/BottomNav';
import MascotChatBubble from '@/components/aurora/MascotChatBubble';

/**
 * (dashboard) layout — mobile bottom nav + always-accessible Aurora chat
 * bubble across every dashboard route. Routes are gated by src/middleware.ts.
 *
 * Bubble mount LIVES IN LAYOUT (not page.tsx) — single source of truth so
 * dashboard / shape-a/b/c / settings / onboarding all share one chat surface.
 * Bubble does not receive `composite` at the layout level (server-side macro
 * snapshot is page-scoped); the chat works without macro context (optional
 * prop). Day 11 / W3 Day 1 anonymous Tier 0 scaffold per
 * [[aurora-chat-bidirectional-safety-filter]].
 *
 * Legacy `mascot/MascotChatBubble` + `/api/mascot` removed 2026-05-24 —
 * duplicate floating bubble was the visible side-effect of the stale stack
 * (hit `/api/mascot` with no anonymous session pathway).
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16">
      {children}
      <BottomNav />
      <MascotChatBubble />
    </div>
  );
}
