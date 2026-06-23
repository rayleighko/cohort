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
 * contrast card (1200×630, the 1.91:1 OG standard) — a stronger hook than the
 * regime matrix, and free of the in-matrix data dots removed from the body.
 *
 * The route is brand-isolated: the global Cohort KR Footer is suppressed for
 * /regime (see ConditionalFooter), and the page sets <html lang="en"> at runtime.
 */

const OG_IMAGE = 'https://www.thebearings.app/og/regime-contrast.png';
const CANONICAL = 'https://www.thebearings.app/regime';
const TITLE = 'Bearings — which regime is your portfolio betting on?';
const DESCRIPTION =
  'Every portfolio is a hidden forecast. See which economic regime you’re long — and which one quietly breaks you.';

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
        width: 1200,
        height: 630,
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
