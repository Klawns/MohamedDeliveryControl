'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDeleteRidesAction } from '@/hooks/use-delete-rides-action';
import { useRideSelection } from '@/hooks/use-ride-selection';
import { useRides } from '../hooks/use-rides';

export function useRidesPageController() {
  const rides = useRides();
  const bulkDeleteAction = useDeleteRidesAction();
  const selection = useRideSelection({
    items: rides.rides,
    scopeKey: 'rides-page',
  });
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const selectedRides = useMemo(
    () => rides.rides.filter((ride) => selection.selectedIds.has(ride.id)),
    [rides.rides, selection.selectedIds],
  );

  const handleRideSuccess = useCallback(async () => {
    await rides.fetchData();
    rides.closeRideModal();
  }, [rides]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        selection.exitSelectionMode();
      }
    }

    if (!selection.isSelectionMode) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection.exitSelectionMode, selection.isSelectionMode]);

  useEffect(() => {
    if (!selection.isSelectionMode) {
      setIsBulkDeleteConfirmOpen(false);
    }
  }, [selection.isSelectionMode]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (selectedRides.length === 0) {
      setIsBulkDeleteConfirmOpen(false);
      return;
    }

    const result = await bulkDeleteAction.deleteRides(selectedRides);

    if (result.success) {
      selection.exitSelectionMode();
      setIsBulkDeleteConfirmOpen(false);
    }
  }, [bulkDeleteAction, selectedRides, selection]);

  return {
    header: {
      onNewRide: rides.openCreateModal,
      totalCount: rides.totalCount,
      hasActiveFilters: rides.hasActiveFilters,
    },
    frequentClients: {
      clients: rides.frequentClients,
      isLoading: rides.isFrequentLoading,
      onSelectClient: rides.openQuickCreateModal,
    },
    filters: {
      filters: rides.filterState,
      clientAutocomplete: rides.clientAutocomplete,
      activeFilterChips: rides.activeFilterChips,
      activeFilterCount: rides.activeFilterCount,
      setSearch: rides.setSearch,
      setPaymentFilter: rides.setPaymentFilter,
      setStartDate: rides.setStartDate,
      setEndDate: rides.setEndDate,
      setPeriodPreset: rides.setPeriodPreset,
      isFiltersOpen: rides.isFiltersOpen,
      setIsFiltersOpen: rides.setIsFiltersOpen,
      hasActiveFilters: rides.hasActiveFilters,
      onClearFilters: rides.clearFilters,
    },
    ridesList: {
      rides: rides.rides,
      totalCount: rides.totalCount,
      isLoading: rides.isLoading,
      isFetching: rides.isFetching,
      hasNextPage: rides.hasNextPage,
      onLoadMore: rides.fetchNextPage,
      isFetchingNextPage: rides.isFetchingNextPage,
      error: rides.ridesError,
      loadMoreError: rides.loadMoreError,
      retry: rides.fetchData,
      retryLoadMore: rides.retryLoadMore,
      onEdit: rides.handleEditRide,
      onDelete: rides.setRideToDelete,
      onChangePaymentStatus: rides.setPaymentStatus,
      isPaymentUpdating: rides.isUpdatingRide,
      hasActiveFilters: rides.hasActiveFilters,
      onClearFilters: rides.clearFilters,
      isSelectionMode: selection.isSelectionMode,
      selectedCount: selection.selectedCount,
      totalVisible: selection.totalVisible,
      isRideSelected: selection.isSelected,
      onEnterSelectionMode: selection.enterSelectionMode,
      onExitSelectionMode: selection.exitSelectionMode,
      onToggleRideSelection: selection.toggleItem,
      onToggleSelectAllVisible: selection.selectAllVisible,
      isAllVisibleSelected: selection.isAllVisibleSelected,
      isSelectionIndeterminate: selection.isIndeterminate,
      onDeleteSelected: () => setIsBulkDeleteConfirmOpen(true),
      isDeletingSelected: bulkDeleteAction.isDeletingRides,
    },
    rideDialog: {
      isOpen: rides.isRideModalOpen,
      onClose: rides.closeRideModal,
      onSuccess: handleRideSuccess,
      rideToEdit: rides.rideToEdit || undefined,
      clientId: rides.selectedQuickClient?.id,
      clientName: rides.selectedQuickClient?.name,
    },
    deleteDialog: {
      isOpen: !!rides.rideToDelete,
      onClose: () => rides.setRideToDelete(null),
      onConfirm: rides.handleDeleteRide,
      isLoading: rides.isDeleting,
    },
    bulkDeleteDialog: {
      isOpen: isBulkDeleteConfirmOpen,
      onClose: () => setIsBulkDeleteConfirmOpen(false),
      onConfirm: handleConfirmBulkDelete,
      isLoading: bulkDeleteAction.isDeletingRides,
      selectedCount: selection.selectedCount,
    },
  };
}
