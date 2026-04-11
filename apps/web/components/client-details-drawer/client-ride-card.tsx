'use client';

import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { PaymentComposition } from '@/components/ui/payment-composition';
import { RidePaymentAction } from '@/components/ui/ride-payment-action';
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
}

export function ClientRideCard({
  item,
  onEditRide,
  onDeleteRide,
  onChangePaymentStatus,
  isPaymentUpdating,
}: ClientRideCardProps) {
  const { ride } = item;

  return (
    <div className="rounded-2xl border border-border-subtle bg-card-background/55 p-4 shadow-sm transition-colors hover:bg-card-background">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="rounded-xl border border-icon-info/10 bg-icon-info/10 p-3 text-icon-info">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
        <RidePaymentAction
          paymentStatus={item.paymentStatus}
          onChangeStatus={(status) => onChangePaymentStatus(ride, status)}
          isLoading={isPaymentUpdating(ride.id)}
          size="xs"
        />

        <div className="flex items-center gap-2">
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
    </div>
  );
}
