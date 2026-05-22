import type { ReactNode } from 'react';
import BottomNav from '@/components/ui/BottomNav';
import { DisclaimerFooter } from '@/components/ui/Disclaimer';
import MascotChatBubble from '@/components/mascot/MascotChatBubble';

/**
 * Authenticated (dashboard) layout — mobile bottom nav + always-accessible
 * Aurora/Vesper chat bubble. Routes are gated by src/middleware.ts.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16">
      {children}
      <DisclaimerFooter />
      <BottomNav />
      <MascotChatBubble />
    </div>
  );
}
