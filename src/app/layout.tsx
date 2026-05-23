import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import PostHogProvider from '@/components/analytics/PostHogProvider';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Cohort';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cohort.co.kr';

export const metadata: Metadata = {
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
      <body className="min-h-screen bg-cohort-ivory font-sans text-cohort-charcoal antialiased">
        <PostHogProvider>{children}</PostHogProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
