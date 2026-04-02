'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useClientDirectory } from '@/hooks/use-client-directory';
import { financeKeys } from '@/lib/query-keys';
import {
  financeService,
  type FinanceDashboardParams,
  type FinanceDashboardQueryKey,
} from '@/services/finance-service';
import { getSelectedClientName } from '../_lib/finance-metrics';
import { PERIODS, type Period, type PeriodId } from '../_types';

export interface FinanceFiltersState {
  period: PeriodId;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

function buildDashboardParams(
  filters: FinanceFiltersState,
): FinanceDashboardParams | null {
  const clientId = filters.clientId !== 'all' ? filters.clientId : undefined;

  if (filters.period === 'custom') {
    if (!filters.startDate || !filters.endDate) {
      return null;
    }

    return {
      period: 'custom',
      clientId,
      start: filters.startDate,
      end: filters.endDate,
    };
  }

  return {
    period: filters.period,
    clientId,
  };
}

function buildDashboardQueryKey(
  filters: FinanceFiltersState,
): FinanceDashboardQueryKey {
  return {
    period: filters.period,
    clientId: filters.clientId !== 'all' ? filters.clientId : undefined,
    start: filters.period === 'custom' ? filters.startDate : undefined,
    end: filters.period === 'custom' ? filters.endDate : undefined,
  };
}

export function useFinanceDashboard() {
  const { user } = useAuth();
  const { clients } = useClientDirectory();
  const [filters, setFiltersState] = useState<FinanceFiltersState>({
    period: 'month',
    clientId: 'all',
  });

  const setFilters = (newFilters: Partial<FinanceFiltersState>) => {
    setFiltersState((previous) => ({ ...previous, ...newFilters }));
  };

  const dashboardParams = useMemo(
    () => buildDashboardParams(filters),
    [filters],
  );
  const dashboardQueryKey = useMemo(
    () => buildDashboardQueryKey(filters),
    [filters],
  );
  const isEnabled = !!user && dashboardParams !== null;
  const query = useQuery({
    queryKey: financeKeys.dashboard(dashboardQueryKey),
    queryFn: ({ signal }) => {
      if (!dashboardParams) {
        throw new Error('Finance dashboard params are incomplete.');
      }

      return financeService.getDashboard(dashboardParams, signal);
    },
    enabled: isEnabled,
    staleTime: 0,
    gcTime: 300000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const currentPeriod: Period = useMemo(
    () => PERIODS.find((period) => period.id === filters.period) || PERIODS[0],
    [filters.period],
  );
  const isClientView = Boolean(filters.clientId && filters.clientId !== 'all');
  const selectedClientName = getSelectedClientName(clients, filters.clientId);

  return {
    user,
    clients,
    data: query.data,
    dashboardParams,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    isFetching: query.isFetching,
    refetch: query.refetch,
    currentPeriod,
    filters,
    setFilters,
    isClientView,
    selectedClientName,
  };
}
