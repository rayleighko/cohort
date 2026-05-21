import type { ButtonHTMLAttributes } from 'react';

/**
 * Cohort button — mobile-first, touch target ≥ 44px tall.
 * `primary` = pomegranate fill; `secondary` = outline.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base =
    'min-h-[44px] w-full rounded-xl px-5 py-3 text-base font-semibold transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-cohort-primary text-cohort-ivory active:bg-aurora-concerned'
      : 'border border-cohort-primary text-cohort-primary bg-transparent';

  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
