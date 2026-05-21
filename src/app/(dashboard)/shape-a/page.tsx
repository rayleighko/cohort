import { requireTier } from '@/lib/payment/tier-gating';

/**
 * Shape A — Macro Indicator Dashboard (full). TODO(W3): 50+ indicators + widgets.
 * Pro-gated — free users redirect to /settings#upgrade.
 */
export default async function ShapeAPage() {
  await requireTier('pro');

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold text-cohort-charcoal">매크로 대시보드</h1>
      <p className="mt-2 text-sm text-cohort-charcoal/60">TODO(W3): Shape A full.</p>
    </main>
  );
}
