"use client";

import React, { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ClientExportController } from "@/app/dashboard/clients/_hooks/use-client-export";
import { ConfirmModal } from "@/components/confirm-modal";
import { SelectionActionBarMobile } from "@/components/ride-selection/selection-action-bar-mobile";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRideSelection } from "@/hooks/use-ride-selection";
import { type ClientBalance, type Client, type RideViewModel } from "@/types/rides";
import { ClientFinancePanel } from "@/components/client-details-drawer/client-finance-panel";
import { ClientDetailsHeader } from "@/components/client-details-drawer/client-details-header";
import { ClientRidesHistory } from "@/components/client-details-drawer/client-rides-history";

interface ClientDetailsDrawerProps {
  client: Client | null;
  rides: RideViewModel[];
  balance: ClientBalance | null;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isSettling: boolean;
  clientExport: ClientExportController;
  onClose: () => void;
  onNewRide: () => void;
  onCloseDebt: () => void;
  onAddPayment: () => void;
  onEditRide: (ride: RideViewModel) => void;
  onDeleteRide: (ride: RideViewModel) => void;
  onDeleteRides: (rides: RideViewModel[]) => Promise<{ success: boolean }>;
  onChangePaymentStatus: (
    ride: RideViewModel,
    status: "PAID" | "PENDING",
  ) => void | Promise<unknown>;
  isPaymentUpdating: (rideId: string) => boolean;
  fetchNextPage: () => void;
  isDeletingRides: boolean;
}

export function ClientDetailsDrawer({
  client,
  rides,
  balance,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  isSettling,
  clientExport,
  onClose,
  onNewRide,
  onCloseDebt,
  onAddPayment,
  onEditRide,
  onDeleteRide,
  onDeleteRides,
  onChangePaymentStatus,
  isPaymentUpdating,
  fetchNextPage,
  isDeletingRides,
}: ClientDetailsDrawerProps) {
  const drawerScrollContainerRef = useRef<HTMLDivElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);
  const selection = useRideSelection({
    items: rides,
    scopeKey: client?.id ?? null,
  });
  const selectedRides = React.useMemo(
    () => rides.filter((ride) => selection.selectedIds.has(ride.id)),
    [rides, selection.selectedIds],
  );

  useBodyScrollLock(!!client);

  React.useEffect(() => {
    if (!client) {
      setIsBulkDeleteConfirmOpen(false);
    }
  }, [client]);

  React.useEffect(() => {
    if (!selection.isSelectionMode) {
      setIsBulkDeleteConfirmOpen(false);
    }
  }, [selection.isSelectionMode]);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        selection.exitSelectionMode();
      }
    }

    if (!selection.isSelectionMode) {
      return;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection.exitSelectionMode, selection.isSelectionMode]);

  const handleConfirmBulkDelete = async () => {
    if (selectedRides.length === 0) {
      setIsBulkDeleteConfirmOpen(false);
      return;
    }

    const result = await onDeleteRides(selectedRides);

    if (result.success) {
      selection.exitSelectionMode();
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const bulkDeleteDescription =
    selection.selectedCount === 1
      ? "Deseja realmente excluir a corrida selecionada? Esta acao e irreversivel."
      : `Deseja realmente excluir as ${selection.selectedCount} corridas selecionadas? Esta acao e irreversivel.`;

  return (
    <AnimatePresence mode="wait">
      {client && (
        <>
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              ref={drawerPanelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-10 flex h-dvh w-full max-w-xl flex-col overflow-hidden border-l border-border bg-drawer-background shadow-2xl"
            >
              <div
                ref={drawerScrollContainerRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
                data-qa="client-drawer-rides"
              >
                <div
                  className={`flex min-h-full flex-col gap-6 p-6 lg:gap-8 lg:p-8 ${
                    isMobile && selection.isSelectionMode ? "pb-28" : ""
                  }`}
                >
                  <div className="space-y-6 lg:space-y-8">
                    <ClientDetailsHeader client={client} onClose={onClose} />

                    <ClientFinancePanel
                      balance={balance}
                      isSettling={isSettling}
                      onNewRide={onNewRide}
                      onAddPayment={onAddPayment}
                      onCloseDebt={onCloseDebt}
                      clientExport={clientExport}
                      drawerPortalContainer={drawerPanelRef.current}
                    />
                  </div>

                  <ClientRidesHistory
                    rides={rides}
                    isLoading={isLoading}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                    containerRef={drawerScrollContainerRef}
                    onEditRide={onEditRide}
                    onDeleteRide={onDeleteRide}
                    onChangePaymentStatus={onChangePaymentStatus}
                    isPaymentUpdating={isPaymentUpdating}
                    isSelectionMode={selection.isSelectionMode}
                    selectedCount={selection.selectedCount}
                    totalLoaded={selection.totalVisible}
                    isRideSelected={selection.isSelected}
                    onEnterSelectionMode={selection.enterSelectionMode}
                    onExitSelectionMode={selection.exitSelectionMode}
                    onToggleRideSelection={selection.toggleItem}
                    onToggleSelectAllLoaded={selection.selectAllVisible}
                    isAllLoadedSelected={selection.isAllVisibleSelected}
                    isSelectionIndeterminate={selection.isIndeterminate}
                    onDeleteSelected={() => setIsBulkDeleteConfirmOpen(true)}
                    isDeletingSelected={isDeletingRides}
                  />
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isMobile && selection.isSelectionMode ? (
                  <motion.div
                    key="drawer-selection-mobile-actions"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    <SelectionActionBarMobile
                      className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur-md"
                      isAllVisibleSelected={selection.isAllVisibleSelected}
                      hasSelection={selection.hasSelection}
                      isDeleting={isDeletingRides}
                      onToggleSelectAll={() =>
                        selection.selectAllVisible(!selection.isAllVisibleSelected)
                      }
                      onDeleteSelected={() => setIsBulkDeleteConfirmOpen(true)}
                      onCancel={selection.exitSelectionMode}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>

          <ConfirmModal
            isOpen={isBulkDeleteConfirmOpen}
            onClose={() => setIsBulkDeleteConfirmOpen(false)}
            onConfirm={handleConfirmBulkDelete}
            title="Excluir corridas selecionadas"
            description={bulkDeleteDescription}
            confirmText="Excluir selecionadas"
            variant="danger"
            isLoading={isDeletingRides}
          />
        </>
      )}
    </AnimatePresence>
  );
}
