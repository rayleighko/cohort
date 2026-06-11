'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/**
 * ConditionalFooter — pathname-aware wrapper for the global Footer.
 *
 * Authenticated dashboard surfaces (BottomNav owns navigation, MascotChatBubble
 * floats over the page) treat the Footer as redundant. Public marketing /
 * compliance pages (Landing, Privacy, Terms, signup, login, waitlist) keep it
 * for 운영자 정보 + 면책 고지 표시 + brand surface.
 *
 * Routes are matched by prefix; child routes (e.g. /settings/notifications)
 * inherit the hide rule. SSR fallback (no pathname yet) renders the Footer
 * so first paint never flashes operator info missing on a public route.
 */
const HIDE_FOOTER_PREFIXES = [
  '/dashboard',
  '/chat',
  '/settings',
  '/onboarding',
  '/shape-a',
  '/shape-b',
  '/shape-c',
];

export function ConditionalFooter() {
  const pathname = usePathname();
  if (!pathname) return <Footer />;
  if (HIDE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return <Footer />;
}
