'use client';

import { ChevronDown } from 'lucide-react';

import type { AssetClass } from '@/domains/principle/domain/ips-schema';
import { ASSET_CLASS_OPTIONS } from '@/lib/ips/labels';
import { cn } from '@/lib/utils';

const selectClass = cn(
  'h-11 w-full min-w-0 appearance-none rounded-xl border border-cohort-ink-10 bg-white',
  'pl-3 pr-8 text-sm text-cohort-charcoal',
  'focus:border-cohort-primary focus:outline-none focus:ring-2 focus:ring-cohort-primary/20',
);

const pctInputClass = cn(
  'h-11 w-full rounded-xl border border-cohort-ink-10 pl-2 pr-6 text-center text-sm tabular-nums',
  'focus:border-cohort-primary focus:outline-none focus:ring-2 focus:ring-cohort-primary/20',
);

interface AllocationTargetRowProps {
  assetClass: AssetClass;
  weightPct: number;
  canRemove: boolean;
  onAssetChange: (assetClass: AssetClass) => void;
  onWeightChange: (weightPct: number) => void;
  onRemove: () => void;
}

export function AllocationTargetRow({
  assetClass,
  weightPct,
  canRemove,
  onAssetChange,
  onWeightChange,
  onRemove,
}: AllocationTargetRowProps) {
  return (
    <div
      className={cn(
        'grid items-center gap-2',
        canRemove
          ? 'grid-cols-[minmax(0,1fr)_4.25rem_auto]'
          : 'grid-cols-[minmax(0,1fr)_4.25rem]',
      )}
    >
      <div className="relative min-w-0">
        <select
          value={assetClass}
          onChange={(e) => onAssetChange(e.target.value as AssetClass)}
          className={selectClass}
          aria-label="자산군"
        >
          {ASSET_CLASS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cohort-ink-50"
          aria-hidden
        />
      </div>
      <div className="relative">
        <input
          type="number"
          min={0}
          max={100}
          inputMode="numeric"
          value={weightPct || ''}
          onChange={(e) => {
            const n = Number(e.target.value);
            onWeightChange(Number.isFinite(n) ? n : 0);
          }}
          className={pctInputClass}
          aria-label="목표 비중 (%)"
        />
        <span
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-cohort-ink-50"
          aria-hidden
        >
          %
        </span>
      </div>
      {canRemove && (
        <button
          type="button"
          className="min-h-[44px] shrink-0 px-1 text-xs text-cohort-ink-50"
          onClick={onRemove}
        >
          삭제
        </button>
      )}
    </div>
  );
}
