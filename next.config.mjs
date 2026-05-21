import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  images: {
    remotePatterns: [
      // Future CDN subdomain for mascot art + screenshots
      { protocol: 'https', hostname: 'cdn.cohort.co.kr' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/service-worker.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

// Sentry build-time wrapper. Org/project per plancy-dev. `silent` keeps build logs clean.
// SENTRY_AUTH_TOKEN env var enables source-map upload in CI/Vercel; safe to omit locally.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: 'plancy-dev',
  project: 'cohort',
});
