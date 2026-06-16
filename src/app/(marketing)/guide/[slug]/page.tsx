/**
 * SEO content / guide pages (1-10). TODO(W5+): render guide content per slug.
 */
export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-cohort-charcoal">가이드</h1>
      <p className="mt-2 text-sm text-cohort-charcoal/60">
        TODO(W5+): SEO content — slug: {slug}
      </p>
    </main>
  );
}
