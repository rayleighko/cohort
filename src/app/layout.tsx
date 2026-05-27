import type { Metadata, Viewport } from 'next';
import * as Sentry from '@sentry/nextjs';
import '@/styles/globals.css';
import PostHogProvider from '@/components/analytics/PostHogProvider';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import { Footer } from '@/components/layout/Footer';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Cohort';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cohort.co.kr';

const baseMetadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Cohort — 흔들리지 않는 투자 페이스',
    template: '%s · Cohort',
  },
  description:
    'Top 5-10% sophisticated retail을 위한 투자 페이스 메이트 — Aurora 🕊와 Vesper 🦅의 동행. 정보 + 도구 + 의사결정 지원.',
  applicationName: APP_NAME,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

/**
 * generateMetadata — Sentry wizard requirement (Sentry.getTraceData propagates
 * server → client trace continuity via HTML metadata). Required by @sentry/nextjs
 * 8.0+ Next.js 14 app router pattern.
 *
 * Note: Next.js requires `metadata` OR `generateMetadata`, not both. We chose
 * generateMetadata to inject runtime trace data on each request.
 */
export function generateMetadata(): Metadata {
  return {
    ...baseMetadata,
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#A8243F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-cohort-ivory font-sans text-cohort-charcoal antialiased">
        <PostHogProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </PostHogProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
