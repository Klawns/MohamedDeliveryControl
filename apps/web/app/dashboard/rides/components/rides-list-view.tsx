"use client";

import { useRef } from "react";
import { Bike, SearchX } from "lucide-react";
import { InfiniteScrollTrigger } from "@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger";
import { ScrollBoundaryContainer } from "@/components/ui/scroll-boundary-container";
import { PaymentStatus, RideViewModel } from "@/types/rides";
import { type RidesListPresentation } from "../_mappers/rides-list.presenter";
import { RideCard } from "./ride-card";
import { RideSkeleton } from "./ride-skeleton";

interface RidesListActions {
  onEdit: (ride: RideViewModel) => void;
  onDelete: (ride: RideViewModel) => void;
  onChangePaymentStatus: (
    ride: RideViewModel,
    status: PaymentStatus,
  ) => void | Promise<unknown>;
  isPaymentUpdating: (rideId: string) => boolean;
  onClearFilters: () => void;
}

interface RidesListPaginationProps {
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  isFetchingNextPage?: boolean;
  loadMoreError?: unknown;
  retry?: () => void | Promise<unknown>;
  retryLoadMore?: () => void | Promise<unknown>;
}

interface RidesListViewProps {
  viewModel: RidesListPresentation;
  actions: RidesListActions;
  pagination: RidesListPaginationProps;
}

function RidesListLoadingState() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(5)].map((_, index) => (
        <RideSkeleton key={index} />
      ))}
    </div>
  );
}

function RidesListErrorState({
  errorMessage,
  retry,
}: {
  errorMessage: string;
  retry?: () => void | Promise<unknown>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-border-subtle bg-card-background/60 px-6 py-20 text-center">
      <div className="space-y-2">
        <h3 className="text-2xl font-display font-extrabold tracking-tight text-text-primary">
          Erro ao carregar corridas
        </h3>
        <p className="max-w-md text-sm text-text-secondary">{errorMessage}</p>
      </div>
      {retry ? (
        <button
          type="button"
          onClick={() => void retry()}
          className="rounded-2xl bg-button-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-button-primary-foreground transition-colors hover:bg-button-primary-hover"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

function RidesListEmptyState({
  title,
  description,
  variant,
  onClearFilters,
}: {
  title: string;
  description: string;
  variant: RidesListPresentation["emptyStateVariant"];
  onClearFilters: () => void;
}) {
  const isFiltered = variant === "filtered";

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-[1.75rem] border border-dashed border-border-subtle bg-card-background/50 px-6 py-20 text-center">
      <div className="rounded-full bg-secondary/10 p-5 text-text-secondary/40">
        {isFiltered ? <SearchX size={40} /> : <Bike size={40} />}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-display font-extrabold tracking-tight text-text-primary">
          {title}
        </h3>
        <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      </div>
      {isFiltered ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-2xl border border-border-subtle px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-text-primary transition-colors hover:border-border hover:bg-hover-accent"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}

function RidesListResults({
  viewModel,
  actions,
  pagination,
}: {
  viewModel: RidesListPresentation;
  actions: RidesListActions;
  pagination: RidesListPaginationProps;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldRenderLoadMore = Boolean(
    pagination.hasNextPage ||
    pagination.isFetchingNextPage ||
    pagination.loadMoreError,
  );

  return (
    <ScrollBoundaryContainer
      containerRef={scrollContainerRef}
      handoff
      hideScrollbar
      className="max-h-[min(68dvh,56rem)] space-y-6 overflow-y-auto pr-1 scrollbar-hide sm:space-y-8"
    >
      {viewModel.groupedRides.map((group) => (
        <section key={group.id} className="space-y-2.5 sm:space-y-3">
          <div className="sticky top-0 z-10 -mx-1 bg-background/90 px-1 py-1 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-secondary/75">
              {group.label}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {group.rides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onEdit={actions.onEdit}
                onDelete={actions.onDelete}
                onChangePaymentStatus={actions.onChangePaymentStatus}
                isPaymentUpdating={actions.isPaymentUpdating(ride.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {shouldRenderLoadMore ? (
        <InfiniteScrollTrigger
          onIntersect={pagination.onLoadMore || (() => undefined)}
          isLoading={!!pagination.isFetchingNextPage}
          hasMore={!!pagination.hasNextPage}
          error={pagination.loadMoreError}
          retry={
            typeof pagination.retryLoadMore === "function"
              ? () => void pagination.retryLoadMore?.()
              : undefined
          }
          rootRef={scrollContainerRef}
        />
      ) : null}
    </ScrollBoundaryContainer>
  );
}

export function RidesListView({
  viewModel,
  actions,
  pagination,
}: RidesListViewProps) {
  const renderContent = () => {
    switch (viewModel.contentState) {
      case "loading":
        return <RidesListLoadingState />;
      case "error":
        return (
          <RidesListErrorState
            errorMessage={
              viewModel.errorMessage ?? "Ocorreu um erro inesperado."
            }
            retry={pagination.retry}
          />
        );
      case "empty":
        return (
          <RidesListEmptyState
            title={viewModel.emptyTitle}
            description={viewModel.emptyDescription}
            variant={viewModel.emptyStateVariant}
            onClearFilters={actions.onClearFilters}
          />
        );
      case "results":
        return (
          <RidesListResults
            viewModel={viewModel}
            actions={actions}
            pagination={pagination}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="rounded-[2rem] border border-border-subtle bg-background/80 p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-2 border-b border-border-subtle/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-display font-bold tracking-tight text-text-primary">
            Lista de corridas
          </h2>
          <p className="text-sm text-text-secondary">
            Valor em destaque, status financeiro discreto e detalhes sob
            demanda.
          </p>
        </div>

        <div className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">
            {viewModel.resultsLabel}
          </span>
          {" / "}
          Ordenadas por data
        </div>
      </div>

      {renderContent()}
    </section>
  );
}
