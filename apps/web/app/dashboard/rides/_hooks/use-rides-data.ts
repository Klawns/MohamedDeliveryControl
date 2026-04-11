'use client';

import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useRidePaymentStatus } from '@/hooks/use-ride-payment-status';
import { rideKeys } from '@/lib/query-keys';
import { ridesService } from '@/services/rides-service';
import { RideViewModel, RidesFilterState } from '@/types/rides';

interface UseRidesDataProps {
  filters: RidesFilterState;
  pageSize: number;
}

function buildRideFilters(filters: RidesFilterState, pageSize: number) {
  return {
    limit: pageSize,
    paymentStatus:
      filters.paymentFilter !== 'all' ? filters.paymentFilter : undefined,
    clientId: filters.clientId || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    search: filters.search || undefined,
  };
}

function getUniqueRides(rides: RideViewModel[]) {
  return Array.from(
    new Map(
      rides.filter((ride) => ride?.id).map((ride) => [String(ride.id), ride]),
    ).values(),
  );
}

export function useRidesData({ filters, pageSize }: UseRidesDataProps) {
  const { user } = useAuth();
  const paymentStatus = useRidePaymentStatus();

  const activeFilters = useMemo(
    () => buildRideFilters(filters, pageSize),
    [filters, pageSize],
  );

  const {
    data: ridesData,
    isLoading: isRidesLoading,
    isFetching: isRidesFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    error: ridesError,
    refetch: fetchRides,
  } = useInfiniteQuery({
    queryKey: rideKeys.infinite(activeFilters),
    queryFn: ({ pageParam, signal }) =>
      ridesService.getRides(
        {
          ...activeFilters,
          cursor: pageParam as string | undefined,
        },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.nextCursor : undefined,
    enabled: !!user,
    staleTime: 120000,
    gcTime: 300000,
  });

  const allRides = ridesData?.pages.flatMap((page) => page.data) || [];
  const rides = getUniqueRides(allRides);
  const totalCount = ridesData?.pages[0]?.meta?.total ?? rides.length;
  const loadMoreError = isFetchNextPageError ? ridesError : undefined;

  const {
    data: frequentClients = [],
    isLoading: isFrequentLoading,
    refetch: fetchFrequentClients,
  } = useQuery({
    queryKey: rideKeys.frequentClients(),
    queryFn: ({ signal }) => ridesService.getFrequentClients(signal),
    enabled: !!user,
  });

  return {
    rides,
    totalCount,
    frequentClients,
    isLoading: isRidesLoading,
    isFetching: isRidesFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFrequentLoading,
    ridesError,
    loadMoreError,
    fetchRides,
    retryLoadMore: fetchNextPage,
    fetchFrequentClients,
    setPaymentStatus: paymentStatus.setPaymentStatus,
    isUpdatingRide: paymentStatus.isUpdatingRide,
  };
}
