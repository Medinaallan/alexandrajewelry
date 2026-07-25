import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Variant = 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  gold: 'btn-gold',
  outline: 'btn-outline',
  ghost: 'inline-flex items-center gap-2 text-sm font-medium text-[--text-muted] hover:text-[--gold] transition-colors',
  danger: 'inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-widest border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors',
};

const sizeClasses: Record<Size, string> = {
  sm: '!py-2 !px-4 !text-xs',
  md: '',
  lg: '!py-4 !px-8 !text-sm',
};

export function Button({
  variant = 'gold',
  size = 'md',
  isLoading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        variantClasses[variant],
        size !== 'md' && sizeClasses[size],
        (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
