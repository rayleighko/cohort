import { requireTier } from '@/lib/payment/tier-gating';

/**
 * Shape B — 분할매수 Decision Support. TODO(W3-W4): 3-score display per ticker.
 * Pro-gated — free users redirect to /settings#upgrade.
 */
export default async function ShapeBPage() {
  await requireTier('pro');

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold text-cohort-charcoal">분할매수 의사결정 지원</h1>
      <p className="mt-2 text-sm text-cohort-charcoal/60">TODO(W3-W4): Shape B.</p>
    </main>
  );
}
