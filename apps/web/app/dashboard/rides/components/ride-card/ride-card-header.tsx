import { cn } from '@/lib/utils';
import { RideCardFinancialBadge } from './ride-card-financial-badge';
import { getRideCardFinancialTheme } from './ride-card.financial-theme';
import type { RideCardPresentation } from './ride-card.types';

interface RideCardHeaderProps {
  presentation: RideCardPresentation;
}

export function RideCardHeader({ presentation }: RideCardHeaderProps) {
  const financialTheme = getRideCardFinancialTheme(presentation.financialState);

  return (
    <>
      <div className="space-y-3 sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate font-display text-xl font-extrabold tracking-tight text-text-primary">
            {presentation.clientName}
          </h3>

          <p className="shrink-0 text-right font-display text-[1.5rem] font-black leading-none tracking-tight text-text-primary">
            {presentation.formattedValue}
          </p>
        </div>

        <p className="truncate text-sm text-text-secondary">
          {presentation.metaItems.join(' • ')}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <RideCardFinancialBadge
            financialState={presentation.financialState}
            label={presentation.financialLabel}
            className={financialTheme.badgeClassName}
            dotClassName={financialTheme.dotClassName}
          />

          {presentation.financialHelper ? (
            <p
              className={cn(
                'text-sm font-medium',
                financialTheme.helperClassName,
              )}
            >
              {presentation.financialHelper}
            </p>
          ) : null}
        </div>
      </div>

      <div className="hidden sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-secondary/70">
            {presentation.rideShortLabel}
          </p>
          <h3 className="truncate font-display text-2xl font-extrabold tracking-tight text-text-primary">
            {presentation.clientName}
          </h3>
          <p className="truncate text-sm text-text-secondary">
            {presentation.metaItems.join(' • ')}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-3xl font-black tracking-tight text-text-primary">
            {presentation.formattedValue}
          </p>

          <div className="mt-2 flex justify-end">
            <RideCardFinancialBadge
              financialState={presentation.financialState}
              label={presentation.financialLabel}
              className={financialTheme.badgeClassName}
              dotClassName={financialTheme.dotClassName}
            />
          </div>

          {presentation.financialHelper ? (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                financialTheme.helperClassName,
              )}
            >
              {presentation.financialHelper}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
