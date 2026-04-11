'use client';

import { useCallback } from 'react';
import { useRides } from '../hooks/use-rides';

export function useRidesPageController() {
  const rides = useRides();

  const handleRideSuccess = useCallback(async () => {
    await rides.fetchData();
    rides.closeRideModal();
  }, [rides]);

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
  };
}
