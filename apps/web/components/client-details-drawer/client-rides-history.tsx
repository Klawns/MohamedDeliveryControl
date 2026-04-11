"use client";

import type { RefObject } from "react";
import { ClientRideCard } from "@/components/client-details-drawer/client-ride-card";
import { ClientRidesCardsContainer } from "@/components/ui/client-rides-cards-container";
import {
  getClientRidesCountLabel,
  toClientRideCardItems,
  type ClientRideCardItem,
} from "@/components/client-details-drawer/mappers/client-ride-card.mapper";
import { type RideViewModel } from "@/types/rides";

interface ClientRidesHistoryProps {
  rides: RideViewModel[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  containerRef?: RefObject<HTMLElement | null>;
  onEditRide: (ride: RideViewModel) => void;
  onDeleteRide: (ride: RideViewModel) => void;
  onChangePaymentStatus: (
    ride: RideViewModel,
    status: "PAID" | "PENDING",
  ) => void | Promise<unknown>;
  isPaymentUpdating: (rideId: string) => boolean;
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-border-subtle bg-card-background/40 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary/30" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-secondary/30" />
                <div className="h-3 w-24 rounded bg-secondary/20" />
              </div>
            </div>
            <div className="h-8 w-20 rounded bg-secondary/20" />
          </div>
          <div className="mt-4 h-8 w-full rounded-xl bg-secondary/20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-border-subtle bg-card-background/40 p-8 text-center">
      <div className="max-w-xs space-y-2">
        <p className="text-base font-semibold text-text-primary">
          O historico ainda esta vazio.
        </p>
        <p className="text-sm text-text-secondary">
          Use a acao Nova corrida para adicionar o primeiro registro deste
          cliente.
        </p>
      </div>
    </div>
  );
}

export function ClientRidesHistory({
  rides,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  containerRef,
  onEditRide,
  onDeleteRide,
  onChangePaymentStatus,
  isPaymentUpdating,
}: ClientRidesHistoryProps) {
  const rideCardItems = toClientRideCardItems(rides);
  const rideCountLabel = getClientRidesCountLabel(rideCardItems.length);

  const ridesList = (
    <ClientRidesCardsContainer<ClientRideCardItem>
      items={rideCardItems}
      containerRef={containerRef}
      hasMore={hasNextPage}
      onLoadMore={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      renderItem={(item) => {
        return (
          <ClientRideCard
            item={item}
            onEditRide={onEditRide}
            onDeleteRide={onDeleteRide}
            onChangePaymentStatus={onChangePaymentStatus}
            isPaymentUpdating={isPaymentUpdating}
          />
        );
      }}
    />
  );

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary">
            Historico de corridas
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {rideCardItems.length === 0 && !isLoading
              ? "Nenhuma corrida registrada para este cliente."
              : rideCountLabel}
          </p>
        </div>
        {hasNextPage ? (
          <span className="rounded-full border border-border-subtle bg-secondary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
            Mais registros ao rolar
          </span>
        ) : null}
      </div>

      {isLoading && rideCardItems.length === 0 ? <LoadingState /> : null}
      {!isLoading && rideCardItems.length === 0 ? <EmptyState /> : null}
      {rideCardItems.length > 0 ? ridesList : null}
    </section>
  );
}
