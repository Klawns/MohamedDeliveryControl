'use client';

import { CheckCircle2, CircleDashed, LoaderCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RideViewModel } from '@/types/rides';
import type { RideCardPresentation } from './ride-card.types';

interface RideCardActionsProps {
  ride: RideViewModel;
  presentation: RideCardPresentation;
  onEdit: (ride: RideViewModel) => void;
  onDelete: (ride: RideViewModel) => void;
  onChangePaymentStatus: (ride: RideViewModel, status: 'PAID' | 'PENDING') => void | Promise<unknown>;
  isPaymentUpdating: boolean;
}

export function RideCardActions({
  ride,
  presentation,
  onEdit,
  onDelete,
  onChangePaymentStatus,
  isPaymentUpdating,
}: RideCardActionsProps) {
  const nextStatus = ride.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-card-background text-text-secondary transition-colors hover:border-border hover:bg-hover-accent hover:text-text-primary sm:h-9 sm:w-9"
          title="Abrir acoes da corrida"
          aria-label="Abrir menu de acoes da corrida"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-48 rounded-2xl border-border-subtle bg-card-background p-1.5"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onEdit(ride);
          }}
          className="rounded-xl font-medium text-text-primary"
        >
          <Pencil size={14} />
          Editar
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={isPaymentUpdating}
          onSelect={(event) => {
            event.preventDefault();

            if (isPaymentUpdating) {
              return;
            }

            void onChangePaymentStatus(ride, nextStatus);
          }}
          className="rounded-xl font-medium text-text-primary"
        >
          {isPaymentUpdating ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : nextStatus === 'PAID' ? (
            <CheckCircle2 size={14} />
          ) : (
            <CircleDashed size={14} />
          )}
          {presentation.paymentActionLabel}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault();
            onDelete(ride);
          }}
          className="rounded-xl font-medium"
        >
          <Trash2 size={14} />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
