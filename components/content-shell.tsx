import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/** Consistent horizontal padding and max width for all authenticated views */
export function ContentShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}
