import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        size === 'default' && 'min-h-11 px-5 py-2.5',
        size === 'sm' && 'min-h-9 px-3.5 py-2 text-xs',
        size === 'icon' && 'h-11 w-11 min-h-[44px] min-w-[44px] p-0',
        variant === 'default' &&
          'bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow-md',
        variant === 'outline' &&
          'border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-700 hover:bg-slate-100',
        variant === 'danger' &&
          'border border-red-200 bg-white text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50',
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
