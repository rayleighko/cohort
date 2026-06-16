/**
 * IPS document → companion-safe summary (Option B, no advice).
 */
import type { IpsDocument } from '@/domains/principle/domain/ips-schema';
import { safeParseIpsDocument } from '@/domains/principle/domain/ips-schema';
import {
  ASSET_CLASS_OPTIONS,
  HORIZON_BAND_OPTIONS,
} from '@/lib/ips/labels';

export interface CompanionIpsSummary {
  hasIps: boolean;
  horizonLabel?: string;
  allocationLine?: string;
  drawdownReviewPct?: number;
  preCommitmentExcerpt?: string;
  version?: number;
}

function labelForHorizon(band: IpsDocument['horizon']['yearsBand']): string {
  return (
    HORIZON_BAND_OPTIONS.find((o) => o.value === band)?.label ?? band
  );
}

function assetLabel(assetClass: IpsDocument['allocation']['targets'][0]['assetClass']): string {
  return ASSET_CLASS_OPTIONS.find((o) => o.value === assetClass)?.label ?? assetClass;
}

/** Build a short allocation string for companion copy (top weights). */
export function formatAllocationLine(doc: IpsDocument, maxItems = 3): string {
  const sorted = [...doc.allocation.targets].sort(
    (a, b) => b.weightPct - a.weightPct,
  );
  const top = sorted.slice(0, maxItems);
  const rest = sorted.length - top.length;
  const parts = top.map((t) => `${assetLabel(t.assetClass)} ${t.weightPct}%`);
  if (rest > 0) parts.push(`외 ${rest}개`);
  return parts.join(', ');
}

export function summarizeIpsDocument(
  document: unknown,
  version?: number,
): CompanionIpsSummary {
  const parsed = safeParseIpsDocument(document);
  if (!parsed.success) {
    return { hasIps: false };
  }
  const doc = parsed.data;
  const pre = doc.review.preCommitment.text.trim();
  return {
    hasIps: true,
    horizonLabel: labelForHorizon(doc.horizon.yearsBand),
    allocationLine: formatAllocationLine(doc),
    drawdownReviewPct: doc.lossLimit.maxDrawdownReviewPct,
    preCommitmentExcerpt:
      pre.length > 80 ? `${pre.slice(0, 77)}…` : pre || undefined,
    version,
  };
}
