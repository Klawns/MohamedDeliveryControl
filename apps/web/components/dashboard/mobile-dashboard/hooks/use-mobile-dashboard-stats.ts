'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rideKeys } from '@/lib/query-keys';
import { ridesService } from '@/services/rides-service';

const STATS_QUERY_OPTIONS = {
  staleTime: 30000,
  gcTime: 300000,
  refetchOnMount: 'always' as const,
};

function useRideStatsQuery(period: 'today' | 'week' | 'month', enabled: boolean) {
  return useQuery({
    queryKey: rideKeys.stats({ period }),
    queryFn: ({ signal }) => ridesService.getStats({ period }, signal),
    enabled,
    ...STATS_QUERY_OPTIONS,
  });
}

export function useMobileDashboardStats(enabled: boolean) {
  const todayStats = useRideStatsQuery('today', enabled);
  const weekStats = useRideStatsQuery('week', enabled);
  const monthStats = useRideStatsQuery('month', enabled);

  const stats = useMemo(
    () => ({
      today: todayStats.data?.data?.totalValue,
      week: weekStats.data?.data?.totalValue,
      month: monthStats.data?.data?.totalValue,
      monthRides: monthStats.data?.data?.rides,
    }),
    [todayStats.data, weekStats.data, monthStats.data],
  );

  return {
    stats,
    isPending:
      todayStats.isPending || weekStats.isPending || monthStats.isPending,
    isError: todayStats.isError || weekStats.isError || monthStats.isError,
    error: todayStats.error ?? weekStats.error ?? monthStats.error ?? null,
    refetch: () =>
      Promise.all([
        todayStats.refetch(),
        weekStats.refetch(),
        monthStats.refetch(),
      ]),
  };
}
