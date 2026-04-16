"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bike, SearchX } from "lucide-react";
import { SelectionActionBarMobile } from "@/components/ride-selection/selection-action-bar-mobile";
import { SelectionContextBar } from "@/components/ride-selection/selection-context-bar";
import { SelectionCheckbox } from "@/components/ride-selection/selection-checkbox";
import { InfiniteScrollTrigger } from "@/components/dashboard/mobile-dashboard/components/infinite-scroll-trigger";
import { ScrollBoundaryContainer } from "@/components/ui/scroll-boundary-container";
import { useIsMobile } from "@/hooks/use-mobile";
import { PaymentStatus, RideViewModel } from "@/types/rides";
import { DASHBOARD_MOBILE_NAV_OFFSET } from "@/app/dashboard/_lib/dashboard-navigation";
import { type RidesListPresentation } from "../_mappers/rides-list.presenter";
import { RideCard } from "./ride-card";
import { RideSkeleton } from "./ride-skeleton";

const SELECTION_TRANSITION = {
  duration: 0.16,
  ease: "easeOut",
} as const;

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
  selection: {
    isSelectionMode: boolean;
    selectedCount: number;
    totalVisible: number;
    isRideSelected: (rideId: string) => boolean;
    onEnterSelectionMode: (rideId?: string) => void;
    onExitSelectionMode: () => void;
    onToggleRideSelection: (rideId: string) => void;
    onToggleSelectAllVisible: (isSelected: boolean) => void;
    isAllVisibleSelected: boolean;
    isSelectionIndeterminate: boolean;
    onDeleteSelected: () => void;
    isDeletingSelected: boolean;
  };
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
  selection,
  isMobile,
}: {
  viewModel: RidesListPresentation;
  actions: RidesListActions;
  pagination: RidesListPaginationProps;
  selection: RidesListViewProps["selection"];
  isMobile: boolean;
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
                selection={{
                  isSelectionMode: selection.isSelectionMode,
                  isSelected: selection.isRideSelected(ride.id),
                  onEnterSelectionMode: selection.onEnterSelectionMode,
                  onToggleSelection: selection.onToggleRideSelection,
                  selectionDisabled: selection.isDeletingSelected,
                  canEnterSelectionWithLongPress: isMobile,
                }}
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
  selection,
}: RidesListViewProps) {
  const isMobile = useIsMobile();

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
            selection={selection}
            isMobile={isMobile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section
      className="rounded-[2rem] border border-border-subtle bg-background/80 p-4 shadow-sm sm:p-5"
      style={{
        paddingBottom:
          selection.isSelectionMode && isMobile
            ? `calc(${DASHBOARD_MOBILE_NAV_OFFSET} + 5.5rem)`
            : undefined,
      }}
    >
      <motion.div layout transition={SELECTION_TRANSITION}>
        <AnimatePresence initial={false} mode="popLayout">
          {selection.isSelectionMode ? (
            <motion.div
              key="selection-header"
              layout
              className="mb-5"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SELECTION_TRANSITION}
            >
              <SelectionContextBar
                selectedCount={selection.selectedCount}
                totalVisible={selection.totalVisible}
                onCancel={selection.onExitSelectionMode}
                onToggleSelectAll={() =>
                  selection.onToggleSelectAllVisible(!selection.isAllVisibleSelected)
                }
                isAllVisibleSelected={selection.isAllVisibleSelected}
                onDeleteSelected={selection.onDeleteSelected}
                isDeleting={selection.isDeletingSelected}
                hideInlineActions={isMobile}
              />
            </motion.div>
          ) : (
            <motion.div
              key="default-header"
              layout
              className="mb-5 flex flex-col gap-2 border-b border-border-subtle/70 pb-4 sm:flex-row sm:items-end sm:justify-between"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SELECTION_TRANSITION}
            >
              <h2 className="text-lg font-display font-bold tracking-tight text-text-primary">
                Lista de corridas
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span>
                  <span className="font-semibold text-text-primary">
                    {viewModel.resultsLabel}
                  </span>
                  {" / "}
                  Ordenadas por data
                </span>
                {viewModel.contentState === "results" ? (
                  <motion.button
                    type="button"
                    layout
                    onClick={() => selection.onEnterSelectionMode()}
                    className="inline-flex items-center rounded-xl border border-border-subtle bg-secondary/10 px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary"
                    whileTap={{ scale: 0.98 }}
                  >
                    Selecionar
                  </motion.button>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {selection.isSelectionMode && !isMobile && viewModel.contentState === "results" ? (
            <motion.div
              key="selection-desktop-actions"
              layout
              className="mb-5 overflow-hidden"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={SELECTION_TRANSITION}
            >
              <div className="rounded-[1.5rem] border border-border-subtle bg-card-background/40 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-text-primary">
                  <SelectionCheckbox
                    checked={
                      selection.isAllVisibleSelected
                        ? true
                        : selection.isSelectionIndeterminate
                          ? "indeterminate"
                          : false
                    }
                    onToggle={() =>
                      selection.onToggleSelectAllVisible(!selection.isAllVisibleSelected)
                    }
                    ariaLabel="Selecionar todas as corridas visiveis"
                    disabled={selection.isDeletingSelected}
                  />
                  <span>
                    {selection.isAllVisibleSelected
                      ? "Desmarcar todas"
                      : "Selecionar todas"}
                  </span>
                </label>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {renderContent()}

      <AnimatePresence initial={false}>
        {selection.isSelectionMode && isMobile ? (
          <motion.div
            key="selection-mobile-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={SELECTION_TRANSITION}
          >
            <SelectionActionBarMobile
              className="fixed inset-x-4 z-50 rounded-[1.5rem] border border-border-subtle bg-background/98 p-3 shadow-[0_-14px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl"
              style={{ bottom: DASHBOARD_MOBILE_NAV_OFFSET }}
              isAllVisibleSelected={selection.isAllVisibleSelected}
              hasSelection={selection.selectedCount > 0}
              isDeleting={selection.isDeletingSelected}
              onToggleSelectAll={() =>
                selection.onToggleSelectAllVisible(!selection.isAllVisibleSelected)
              }
              onDeleteSelected={selection.onDeleteSelected}
              onCancel={selection.onExitSelectionMode}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
