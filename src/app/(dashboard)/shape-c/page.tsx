import { requireTier } from '@/lib/payment/tier-gating';

/**
 * Shape C — Custom Trigger Alert + Behavioral Guard. TODO(W4-W5): trigger engine.
 * Pro-gated — free users redirect to /settings#upgrade.
 */
export default async function ShapeCPage() {
  await requireTier('pro');

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold text-cohort-charcoal">커스텀 트리거 알림</h1>
      <p className="mt-2 text-sm text-cohort-charcoal/60">TODO(W4-W5): Shape C.</p>
    </main>
  );
}
