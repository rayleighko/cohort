'use client';

import type { ReactNode } from 'react';

/**
 * Mobile-first modal — bottom-sheet on mobile, centered on larger screens.
 * TODO(Day 2+): focus trap, scroll lock, ESC handling.
 */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-cohort-charcoal/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
