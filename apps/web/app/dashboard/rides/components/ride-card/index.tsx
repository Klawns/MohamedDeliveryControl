'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SelectableCardShell } from '@/components/ride-selection/selectable-card-shell';
import { SelectionCheckbox } from '@/components/ride-selection/selection-checkbox';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { type RideViewModel } from '@/types/rides';
import { RideCardActions } from './ride-card-actions';
import { RideCardDetails } from './ride-card-details';
import { getRideCardFinancialTheme } from './ride-card.financial-theme';
import { RideCardHeader } from './ride-card-header';
import { useRideCardExpanded } from './ride-card.hooks';
import { getRideCardPresentation } from './ride-card.presenter';

interface RideCardProps {
  ride: RideViewModel;
  onEdit: (ride: RideViewModel) => void;
  onDelete: (ride: RideViewModel) => void;
  onChangePaymentStatus: (ride: RideViewModel, status: 'PAID' | 'PENDING') => void | Promise<unknown>;
  isPaymentUpdating: boolean;
  selection?: {
    isSelectionMode: boolean;
    isSelected: boolean;
    onEnterSelectionMode: (rideId?: string) => void;
    onToggleSelection: (rideId: string) => void;
    selectionDisabled?: boolean;
    canEnterSelectionWithLongPress?: boolean;
  };
}

export const RideCard = React.memo(
  ({
    ride,
    onEdit,
    onDelete,
    onChangePaymentStatus,
    isPaymentUpdating,
    selection,
  }: RideCardProps) => {
    const { isOpen, setIsOpen } = useRideCardExpanded();
    const presentation = getRideCardPresentation(ride);
    const financialTheme = getRideCardFinancialTheme(presentation.financialState);
    const isSelectionMode = selection?.isSelectionMode ?? false;
    const isSelected = selection?.isSelected ?? false;

    return (
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 10 }}>
        <SelectableCardShell
          className={cn(
            'rounded-[1.6rem] border border-border-subtle bg-card-background p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4',
            isSelectionMode && isSelected && 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20',
            financialTheme.cardClassName,
          )}
          isSelectionMode={isSelectionMode}
          isSelected={isSelected}
          selectionDisabled={selection?.selectionDisabled}
          canEnterSelectionWithLongPress={selection?.canEnterSelectionWithLongPress}
          onEnterSelectionMode={() => selection?.onEnterSelectionMode(ride.id)}
          onToggleSelection={() => selection?.onToggleSelection(ride.id)}
        >
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start gap-3">
                {isSelectionMode ? (
                  <div
                    data-selection-ignore="true"
                    className="mt-1"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <SelectionCheckbox
                      checked={isSelected}
                      onToggle={() => selection?.onToggleSelection(ride.id)}
                      ariaLabel={`Selecionar corrida ${presentation.rideShortLabel}`}
                      disabled={selection?.selectionDisabled}
                    />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <RideCardHeader presentation={presentation} />
                </div>
              </div>

              {!isSelectionMode ? (
                <>
                  <div className="flex items-center justify-between gap-2 border-t border-border-subtle/70 pt-2.5 sm:gap-3 sm:pt-3">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {isOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
                        <ChevronDown
                          className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
                        />
                      </button>
                    </CollapsibleTrigger>

                    <RideCardActions
                      ride={ride}
                      presentation={presentation}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onChangePaymentStatus={onChangePaymentStatus}
                      isPaymentUpdating={isPaymentUpdating}
                    />
                  </div>

                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <RideCardDetails presentation={presentation} />
                  </CollapsibleContent>
                </>
              ) : null}
            </div>
          </Collapsible>
        </SelectableCardShell>
      </motion.div>
    );
  },
);

RideCard.displayName = 'RideCard';
