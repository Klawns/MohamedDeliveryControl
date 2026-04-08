import { cn } from '@/lib/utils';
import type { RideCardFinancialState } from './ride-card.types';

interface RideCardFinancialBadgeProps {
  financialState: RideCardFinancialState;
  label: string;
  className?: string;
  dotClassName?: string;
}

export function RideCardFinancialBadge({
  financialState,
  label,
  className,
  dotClassName,
}: RideCardFinancialBadgeProps) {
  return (
    <span
      data-financial-state={financialState}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:gap-2 sm:px-2.5 sm:py-1 sm:text-[10px]',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotClassName)} />
      {label}
    </span>
  );
}
