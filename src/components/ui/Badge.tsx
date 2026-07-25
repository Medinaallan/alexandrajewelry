import { cn } from '../../utils/cn';

interface BadgeProps {
  label: string;
  variant?: 'gold' | 'dark' | 'new' | 'sale' | 'popular';
  className?: string;
}

const variantClasses = {
  gold:    'bg-[--gold] text-white',
  dark:    'bg-[--black] text-white',
  new:     'bg-[--black] text-white',
  sale:    'bg-[--gold] text-white',
  popular: 'bg-[--gray-800] text-white',
};

export function Badge({ label, variant = 'dark', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] uppercase',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
