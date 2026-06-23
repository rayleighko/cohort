import type { Metadata } from 'next';

/**
 * Bearings — /regime EN landing metadata (USD validation funnel).
 *
 * Standalone brand surface layered on the existing app. `title.absolute`
 * escapes the root "%s · Cohort" template so the document title is pure
 * Bearings. OG/Twitter values are the exact strings from the launch brief;
 * absolute www.thebearings.app URLs are used so the share card resolves to the
 * production domain regardless of the (preview) host that renders it.
 *
 * Canonical host is www: the apex (thebearings.app) 308-redirects to www at the
 * Vercel domain layer, so canonical/og:url/twitter all point at www to match
 * what is actually served (no apex↔www canonical split).
 *
 * The share card is the "Same kind of crash / opposite outcome" 2008-vs-2022
 * contrast card (1600×900) — a stronger hook than the regime matrix, and free
 * of the in-matrix data dots that were removed from the body visual.
 *
 * The route is brand-isolated: the global Cohort KR Footer is suppressed for
 * /regime (see ConditionalFooter), and the page sets <html lang="en"> at runtime.
 */

const OG_IMAGE = 'https://www.thebearings.app/og/regime-contrast.png';
const CANONICAL = 'https://www.thebearings.app/regime';
const TITLE = 'Bearings — which regime is your portfolio betting on?';
const DESCRIPTION =
  'Every portfolio is a hidden forecast. See which economic regime you’re long, and which one breaks you. No login, no linking, nothing stored.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  applicationName: 'Bearings',
  // Override the root layout's appleWebApp (title: 'Cohort'). Metadata is
  // resolved per-field from the deepest segment, so the whole object must be
  // restated — otherwise the home-screen / Safari pinned title reads "Cohort"
  // on this brand-isolated EN surface.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bearings',
  },
  // Route-scoped Bearings icons. Like appleWebApp above, the whole `icons` field
  // is restated here so it REPLACES the root Cohort icons for /regime only — the
  // root favicon/manifest still serve cohort.co.kr untouched. Files live under
  // /public/bearings/ to keep them clearly separate from the Cohort root icons.
  icons: {
    icon: [
      { url: '/bearings/favicon.ico', sizes: 'any' },
      { url: '/bearings/favicon-16.png', type: 'image/png', sizes: '16x16' },
      { url: '/bearings/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/bearings/favicon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/bearings/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/bearings/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/bearings/apple-touch-icon.png', sizes: '180x180' },
  },
  // Separate Bearings PWA manifest (name "Bearings", lang en, scope /regime) so
  // "add to home screen" from thebearings.app is Bearings-branded. The Cohort KR
  // manifest at /site.webmanifest is left as the root default for cohort.co.kr.
  manifest: '/bearings.webmanifest',
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    siteName: 'Bearings',
    url: CANONICAL,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1600,
        height: 900,
        alt: 'Bearings — same kind of crash, opposite outcome: in 2008 bonds rose as stocks fell; in 2022 both fell together.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RegimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
