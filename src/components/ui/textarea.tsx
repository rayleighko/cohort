import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[88px] w-full rounded-xl border border-cohort-ink-10 bg-white px-4 py-3 text-sm leading-relaxed text-cohort-ink-90 placeholder:text-cohort-ink-30 focus-visible:border-cohort-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cohort-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
