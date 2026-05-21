/**
 * Toss Payments integration (KRW V1).
 * Day 1 = signature scaffold. Day 3 = sandbox test keys + webhook handling
 * until 사업자 verify completes (31-tracker §2.4).
 * TODO(Day 3): subscription create, billing key issue, webhook signature verify.
 */

export interface TossSubscriptionResult {
  ok: boolean;
  orderId?: string;
}

export async function createSubscription(): Promise<TossSubscriptionResult> {
  // TODO(Day 3): real Toss Payments SDK call with sandbox keys.
  return { ok: false };
}
