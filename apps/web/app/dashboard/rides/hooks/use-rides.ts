'use client';

import { useRidesFilters } from '../_hooks/use-rides-filters';
import { useRidesData } from '../_hooks/use-rides-data';
import { useRidesModals } from '../_hooks/use-rides-modals';

const PAGE_SIZE = 10;

export function useRides() {
  const filters = useRidesFilters();

  const data = useRidesData({
    filters: filters.filterState,
    pageSize: PAGE_SIZE,
  });

  const modals = useRidesModals({
    onSuccess: data.fetchRides,
  });

  return {
    rides: data.rides,
    frequentClients: data.frequentClients,
    isLoading: data.isLoading,
    isFetching: data.isFetching,
    isFetchingNextPage: data.isFetchingNextPage,
    hasNextPage: data.hasNextPage,
    fetchNextPage: data.fetchNextPage,
    isFrequentLoading: data.isFrequentLoading,
    totalCount: data.totalCount,
    ridesError: data.ridesError,
    loadMoreError: data.loadMoreError,
    filterState: filters.filterState,
    clientAutocomplete: filters.clientAutocomplete,
    activeFilterChips: filters.activeFilterChips,
    activeFilterCount: filters.activeFilterCount,
    isFiltersOpen: filters.isFiltersOpen,
    hasActiveFilters: filters.hasActiveFilters,
    setSearch: filters.setSearch,
    setPaymentFilter: filters.setPaymentFilter,
    setStartDate: filters.setStartDate,
    setEndDate: filters.setEndDate,
    setPeriodPreset: filters.setPeriodPreset,
    setIsFiltersOpen: filters.setIsFiltersOpen,
    clearFilters: filters.clearFilters,
    pageSize: PAGE_SIZE,
    ...modals,
    fetchData: data.fetchRides,
    retryLoadMore: data.retryLoadMore,
    fetchFrequentClients: data.fetchFrequentClients,
    setPaymentStatus: data.setPaymentStatus,
    isUpdatingRide: data.isUpdatingRide,
  };
}
