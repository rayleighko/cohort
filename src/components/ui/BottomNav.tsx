'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Mobile bottom navigation — fixed inside (dashboard) layout.
 * Tabs: 대시보드 / 매크로 / 분할매수 / 알림 / 설정 (vault 14 §7 routes).
 * Touch target 56px (≥44px AA per 41 §3.2). Active state via usePathname.
 */

type Tab = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: JSX.Element;
};

const TABS: Tab[] = [
  {
    href: '/dashboard',
    label: '대시보드',
    match: (p) => p === '/dashboard' || p === '/',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M3 12 12 4l9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: '/shape-a',
    label: '매크로',
    match: (p) => p.startsWith('/shape-a'),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M3 17l5-5 4 4 8-9" />
        <path d="M3 21h18" />
      </svg>
    ),
  },
  {
    href: '/shape-b',
    label: '분할매수',
    match: (p) => p.startsWith('/shape-b'),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    href: '/shape-c',
    label: '알림',
    match: (p) => p.startsWith('/shape-c'),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '설정',
    match: (p) => p.startsWith('/settings'),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname() ?? '';
  return (
    <>
      {/* Inline-flow spacer — reserves vertical space equal to the fixed
          nav so Footer (root layout sibling) is not occluded. h-20 mobile /
          md:h-24 desktop matches BottomNav's intrinsic height + safe-area
          inset. aria-hidden so screen readers skip the empty element. */}
      <div aria-hidden="true" className="h-20 md:h-24" />
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cohort-ink-10 bg-cohort-ivory/95 backdrop-blur"
        aria-label="주요 네비게이션"
      >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors ${
                  active
                    ? 'text-cohort-primary'
                    : 'text-cohort-ink-50 hover:text-cohort-ink-90'
                }`}
              >
                {tab.icon}
                <span className="leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      </nav>
    </>
  );
}
