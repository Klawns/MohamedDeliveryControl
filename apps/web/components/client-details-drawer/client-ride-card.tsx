'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { SelectableCardShell } from '@/components/ride-selection/selectable-card-shell';
import { SelectionCheckbox } from '@/components/ride-selection/selection-checkbox';
import { PaymentComposition } from '@/components/ui/payment-composition';
import { RidePaymentAction } from '@/components/ui/ride-payment-action';
import { cn } from '@/lib/utils';
import type { RideViewModel } from '@/types/rides';
import type { ClientRideCardItem } from './mappers/client-ride-card.mapper';

const SELECTION_TRANSITION = {
  duration: 0.15,
  ease: 'easeOut',
} as const;

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

  return (
    <motion.div layout transition={SELECTION_TRANSITION}>
      <SelectableCardShell
        className={cn(
          'rounded-2xl border bg-card-background/55 p-4 shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-150 hover:bg-card-background',
          isSelectionMode && isSelected
            ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20'
            : 'border-border-subtle',
        )}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        selectionDisabled={selectionDisabled}
        canEnterSelectionWithLongPress={canEnterSelectionWithLongPress}
        onEnterSelectionMode={() => onEnterSelectionMode(ride.id)}
        onToggleSelection={() => onToggleSelection(ride.id)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <AnimatePresence initial={false}>
              {isSelectionMode ? (
                <motion.div
                  key="selection-checkbox"
                  layout
                  data-selection-ignore="true"
                  className="mt-1"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -2 }}
                  transition={SELECTION_TRANSITION}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <SelectionCheckbox
                    checked={isSelected}
                    onToggle={() => onToggleSelection(ride.id)}
                    ariaLabel={`Selecionar corrida ${item.title}`}
                    disabled={selectionDisabled}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <div
              className={cn(
                'rounded-xl border p-3 transition-[border-color,background-color,color] duration-150',
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

        <AnimatePresence initial={false}>
          {!isSelectionMode ? (
            <motion.div
              key="ride-actions"
              layout
              className="overflow-hidden"
              initial={{ opacity: 0, y: -2, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -2, height: 0 }}
              transition={SELECTION_TRANSITION}
            >
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SelectableCardShell>
    </motion.div>
  );
}
