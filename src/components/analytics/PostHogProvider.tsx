'use client';

import { useEffect } from 'react';
import { initPostHog } from '@/lib/analytics/posthog';

/**
 * Initializes PostHog on mount. Wraps the app in the root layout.
 * No-ops without a production key (placeholder env, Day 1).
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
