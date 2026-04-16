"use client";

import type { RefObject } from "react";
import { ClientRideCard } from "@/components/client-details-drawer/client-ride-card";
import {
  getClientRidesCountLabel,
  toClientRideCardItems,
  type ClientRideCardItem,
} from "@/components/client-details-drawer/mappers/client-ride-card.mapper";
import { SelectionContextBar } from "@/components/ride-selection/selection-context-bar";
import { SelectionCheckbox } from "@/components/ride-selection/selection-checkbox";
import { ClientRidesCardsContainer } from "@/components/ui/client-rides-cards-container";
import { useIsMobile } from "@/hooks/use-mobile";
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
  isSelectionMode: boolean;
  selectedCount: number;
  totalLoaded: number;
  isRideSelected: (rideId: string) => boolean;
  onEnterSelectionMode: (rideId?: string) => void;
  onExitSelectionMode: () => void;
  onToggleRideSelection: (rideId: string) => void;
  onToggleSelectAllLoaded: (isSelected: boolean) => void;
  isAllLoadedSelected: boolean;
  isSelectionIndeterminate: boolean;
  onDeleteSelected: () => void;
  isDeletingSelected: boolean;
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
  isSelectionMode,
  selectedCount,
  totalLoaded,
  isRideSelected,
  onEnterSelectionMode,
  onExitSelectionMode,
  onToggleRideSelection,
  onToggleSelectAllLoaded,
  isAllLoadedSelected,
  isSelectionIndeterminate,
  onDeleteSelected,
  isDeletingSelected,
}: ClientRidesHistoryProps) {
  const isMobile = useIsMobile();
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
            isSelectionMode={isSelectionMode}
            isSelected={isRideSelected(item.id)}
            onEnterSelectionMode={onEnterSelectionMode}
            onToggleSelection={onToggleRideSelection}
            selectionDisabled={isDeletingSelected}
            canEnterSelectionWithLongPress={isMobile}
          />
        );
      }}
    />
  );

  return (
    <section className="flex flex-col gap-5">
      {isSelectionMode ? (
        <SelectionContextBar
          selectedCount={selectedCount}
          totalVisible={totalLoaded}
          onCancel={onExitSelectionMode}
          onToggleSelectAll={() => onToggleSelectAllLoaded(!isAllLoadedSelected)}
          isAllVisibleSelected={isAllLoadedSelected}
          onDeleteSelected={onDeleteSelected}
          isDeleting={isDeletingSelected}
          hideInlineActions={isMobile}
        />
      ) : (
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasNextPage ? (
              <span className="rounded-full border border-border-subtle bg-secondary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                Mais registros ao rolar
              </span>
            ) : null}
            {rideCardItems.length > 0 ? (
              <button
                type="button"
                onClick={() => onEnterSelectionMode()}
                className="inline-flex items-center rounded-xl border border-border-subtle bg-secondary/10 px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary"
              >
                Selecionar
              </button>
            ) : null}
          </div>
        </div>
      )}

      {isLoading && rideCardItems.length === 0 ? <LoadingState /> : null}
      {!isLoading && rideCardItems.length === 0 ? <EmptyState /> : null}
      {isSelectionMode && !isMobile && rideCardItems.length > 0 ? (
        <div className="rounded-[1.5rem] border border-border-subtle bg-card-background/40 p-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-text-primary">
            <SelectionCheckbox
              checked={
                isAllLoadedSelected
                  ? true
                  : isSelectionIndeterminate
                    ? "indeterminate"
                    : false
              }
              onToggle={() => onToggleSelectAllLoaded(!isAllLoadedSelected)}
              ariaLabel="Selecionar todas as corridas carregadas"
              disabled={isDeletingSelected}
            />
            <span>
              {isAllLoadedSelected ? "Desmarcar todas" : "Selecionar todas"}
            </span>
          </label>
          {isSelectionIndeterminate && !isAllLoadedSelected ? (
            <p className="mt-2 text-xs text-text-secondary">
              Parte das corridas carregadas esta selecionada.
            </p>
          ) : null}
        </div>
      ) : null}
      {rideCardItems.length > 0 ? ridesList : null}
    </section>
  );
}
