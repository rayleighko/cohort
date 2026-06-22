import type { Metadata } from 'next';

/**
 * Bearings — /regime EN landing metadata (USD validation funnel).
 *
 * Standalone brand surface layered on the existing app. `title.absolute`
 * escapes the root "%s · Cohort" template so the document title is pure
 * Bearings. OG/Twitter values are the exact strings from the launch brief;
 * absolute thebearings.app URLs are used so the share card resolves to the
 * production domain regardless of the (preview) host that renders it.
 *
 * The route is brand-isolated: the global Cohort KR Footer is suppressed for
 * /regime (see ConditionalFooter), and the page sets <html lang="en"> at runtime.
 */

const OG_IMAGE = 'https://thebearings.app/og/regime.png';
const CANONICAL = 'https://thebearings.app/regime';
const TITLE = 'Bearings — which regime is your portfolio betting on?';
const DESCRIPTION =
  'Every portfolio is a hidden forecast. See which economic regime you’re long, and which one breaks you. No login, no linking, nothing stored.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  applicationName: 'Bearings',
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
        alt: 'Bearings — a 2×2 economic regime matrix: inflation against growth.',
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
