'use client';

import type { KeyboardEvent } from 'react';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useLongPress } from '@/hooks/use-long-press';
import { PaymentComposition } from '@/components/ui/payment-composition';
import { RidePaymentAction } from '@/components/ui/ride-payment-action';
import { cn } from '@/lib/utils';
import type { ClientRideCardItem } from './mappers/client-ride-card.mapper';
import type { RideViewModel } from '@/types/rides';

interface ClientRideCardProps {
  item: ClientRideCardItem;
  onEditRide: (ride: RideViewModel) => void;
  onDeleteRide: (ride: RideViewModel) => void;
  onChangePaymentStatus: (
    ride: RideViewModel,
    status: 'PAID' | 'PENDING',
  ) => void | Promise<unknown>;
  isPaymentUpdating: (rideId: string) => boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onEnterSelectionMode: (rideId?: string) => void;
  onToggleSelection: (rideId: string) => void;
  selectionDisabled?: boolean;
  canEnterSelectionWithLongPress?: boolean;
}

export function ClientRideCard({
  item,
  onEditRide,
  onDeleteRide,
  onChangePaymentStatus,
  isPaymentUpdating,
  isSelectionMode,
  isSelected,
  onEnterSelectionMode,
  onToggleSelection,
  selectionDisabled = false,
  canEnterSelectionWithLongPress = false,
}: ClientRideCardProps) {
  const { ride } = item;
  const longPressHandlers = useLongPress({
    onLongPress: () => onEnterSelectionMode(ride.id),
    disabled: selectionDisabled || isSelectionMode || !canEnterSelectionWithLongPress,
    shouldHandleEvent: (event) => {
      const target = event.target as HTMLElement | null;
      return (
        event.pointerType !== 'mouse' &&
        !target?.closest('[data-selection-ignore="true"]')
      );
    },
  });

  const handleToggleSelection = () => {
    if (!isSelectionMode || selectionDisabled) {
      return;
    }

    onToggleSelection(ride.id);
  };

  const handleSelectionKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isSelectionMode || selectionDisabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleSelection(ride.id);
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card-background/55 p-4 shadow-sm transition-colors hover:bg-card-background',
        isSelectionMode && isSelected
          ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20'
          : 'border-border-subtle',
        isSelectionMode && !selectionDisabled && 'cursor-pointer',
      )}
      role={isSelectionMode ? 'button' : undefined}
      tabIndex={isSelectionMode ? 0 : undefined}
      aria-pressed={isSelectionMode ? isSelected : undefined}
      onClick={handleToggleSelection}
      onKeyDown={handleSelectionKeyDown}
      {...longPressHandlers}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {isSelectionMode ? (
            <div
              data-selection-ignore="true"
              className="mt-1"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(ride.id)}
                aria-label={`Selecionar corrida ${item.title}`}
                disabled={selectionDisabled}
                className="size-5 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
              />
            </div>
          ) : null}
          <div
            className={cn(
              'rounded-xl border p-3',
              isSelectionMode && isSelected
                ? 'border-blue-500/20 bg-blue-500/10 text-blue-600'
                : 'border-icon-info/10 bg-icon-info/10 text-icon-info',
            )}
          >
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-text-primary">
              {item.title}
            </h4>
            <p className="mt-1 text-xs text-text-secondary">{item.subtitle}</p>
            {item.location ? (
              <p className="mt-2 line-clamp-1 text-sm text-text-secondary">
                {item.location}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center text-right">
          <PaymentComposition
            size="sm"
            totalValue={item.totalValue}
            paidWithBalance={item.paidWithBalance}
            debtValue={item.debtValue}
            showLabel={false}
            compact={true}
          />
        </div>
      </div>

      {!isSelectionMode ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <div data-selection-ignore="true">
            <RidePaymentAction
              paymentStatus={item.paymentStatus}
              onChangeStatus={(status) => onChangePaymentStatus(ride, status)}
              isLoading={isPaymentUpdating(ride.id)}
              size="xs"
            />
          </div>

          <div className="flex items-center gap-2" data-selection-ignore="true">
            <button
              type="button"
              onClick={() => onEditRide(ride)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-secondary/10 px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary active:scale-95"
              title="Editar corrida"
            >
              <Pencil size={14} />
              Editar
            </button>
            <button
              type="button"
              onClick={() => onDeleteRide(ride)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-destructive/15 bg-button-destructive-subtle px-3 py-2 text-xs font-semibold text-icon-destructive transition-all hover:bg-button-destructive-subtle/80 active:scale-95"
              title="Excluir corrida"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
