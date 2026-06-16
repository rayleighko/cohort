'use client';

import { CircleHelp } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface IpsHelpTipProps {
  /** Accessible name for the help toggle */
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Inline help toggle — explanation expands below the label row (mobile-friendly).
 */
export function IpsHelpTip({ label, children, className }: IpsHelpTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('min-w-0', className)}>
      <button
        type="button"
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-cohort-ink-50 hover:text-cohort-primary"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <p className="mb-2 rounded-xl border border-cohort-ink-10 bg-cohort-ivory px-3 py-2 text-xs leading-relaxed text-cohort-charcoal/70 break-keep">
          {children}
        </p>
      )}
    </div>
  );
}

interface IpsLabelWithHelpProps {
  htmlFor?: string;
  title: React.ReactNode;
  helpLabel: string;
  helpText: React.ReactNode;
}

export function IpsLabelWithHelp({ htmlFor, title, helpLabel, helpText }: IpsLabelWithHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-0.5">
        <label
          htmlFor={htmlFor}
          className="flex-1 text-sm font-medium leading-snug text-cohort-charcoal break-keep"
        >
          {title}
        </label>
        <button
          type="button"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-cohort-ink-50 hover:text-cohort-primary"
          aria-label={helpLabel}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {open && (
        <p className="rounded-xl border border-cohort-ink-10 bg-cohort-ivory px-3 py-2 text-xs leading-relaxed text-cohort-charcoal/70 break-keep">
          {helpText}
        </p>
      )}
    </div>
  );
}
