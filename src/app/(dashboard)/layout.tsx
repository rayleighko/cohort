import type { ReactNode } from 'react';
import BottomNav from '@/components/ui/BottomNav';
import { DisclaimerFooter } from '@/components/ui/Disclaimer';

/**
 * Authenticated (dashboard) layout — mobile bottom nav + mascot chat bubble.
 * TODO(Day 2): enforce authenticated session (redirect to /login if absent).
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
    </div>
  );
}
