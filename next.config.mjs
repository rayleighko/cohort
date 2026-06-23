import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      // Future CDN subdomain for mascot art + screenshots
      { protocol: 'https', hostname: 'cdn.cohort.co.kr' },
    ],
  },
  async redirects() {
    return [
      // Waitlist retired — preserve old links and SEO bookmarks. Scoped away
      // from the Bearings host so a thebearings.app/waitlist hit doesn't bounce
      // an EN visitor into the KR /signup flow on the wrong domain.
      {
        source: '/waitlist',
        destination: '/signup',
        permanent: false,
        missing: [{ type: 'host', value: '(www\\.)?thebearings\\.app' }],
      },
      // Bearings (EN, USD validation) is served from www.thebearings.app — the
      // canonical host. The apex (thebearings.app) 308-redirects to www at the
      // Vercel domain layer (infra, not code), so this app effectively only
      // ever sees the www host; the `(www\.)?` match keeps a defensive apex
      // fallback in case that edge redirect is ever removed. The root lands on
      // the brand-isolated /regime route (Cohort KR footer hidden, lang='en',
      // OG metadata resolve). cohort.co.kr root stays the Korean landing,
      // untouched. Temporary (307) during validation so the mapping can change
      // without poisoning caches. NB: do NOT add a www→apex redirect here — it
      // would form a loop against the apex→www 308 above.
      {
        source: '/',
        has: [{ type: 'host', value: '(www\\.)?thebearings\\.app' }],
        destination: '/regime',
        permanent: false,
      },
    ];
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

// Sentry build-time wrapper. `org` is the Sentry.io organization slug (legacy name).
// SENTRY_AUTH_TOKEN env var enables source-map upload in CI/Vercel; safe to omit locally.
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "elevate-u2",

  project: "cohort",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
