import type { ReactNode } from 'react';
import BottomNav from '@/components/ui/BottomNav';
import MascotChatBubble from '@/components/aurora/MascotChatBubble';

/**
 * (dashboard) layout — mobile bottom nav + Aurora pace companion FAB.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {children}
      <BottomNav />
      <MascotChatBubble />
    </div>
  );
}
