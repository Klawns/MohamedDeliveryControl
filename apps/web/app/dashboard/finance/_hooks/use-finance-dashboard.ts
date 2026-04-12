'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { financeKeys } from '@/lib/query-keys';
import { financeService } from '@/services/finance-service';
import {
  buildFinanceDashboardParams,
  buildFinanceDashboardQueryKey,
  type FinanceFiltersState,
} from '../_lib/finance-dashboard-query';
import { PERIODS, type Period } from '../_types';
import { useFinanceClientAutocomplete } from './use-finance-client-autocomplete';

export function useFinanceDashboard() {
  const { user } = useAuth();
  const [filters, setFiltersState] = useState<FinanceFiltersState>({
    period: 'month',
    paymentStatus: 'all',
  });
  const clientAutocomplete = useFinanceClientAutocomplete();

  const setFilters = (newFilters: Partial<FinanceFiltersState>) => {
    setFiltersState((previous) => ({ ...previous, ...newFilters }));
  };

  const dashboardParams = useMemo(
    () => buildFinanceDashboardParams(filters, clientAutocomplete.appliedClientId),
    [clientAutocomplete.appliedClientId, filters],
  );
  const dashboardQueryKey = useMemo(
    () =>
      buildFinanceDashboardQueryKey(filters, clientAutocomplete.appliedClientId),
    [clientAutocomplete.appliedClientId, filters],
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
    staleTime: 1000 * 60,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  const currentPeriod: Period = useMemo(
    () => PERIODS.find((period) => period.id === filters.period) || PERIODS[0],
    [filters.period],
  );
  const isClientView = Boolean(clientAutocomplete.appliedClientId);

  return {
    data: query.data,
    dataUpdatedAt: query.dataUpdatedAt,
    dashboardParams,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error ?? null,
    isFetching: query.isFetching,
    refetch: query.refetch,
    currentPeriod,
    filters,
    setFilters,
    clientAutocomplete,
    isClientView,
    selectedClientName: clientAutocomplete.appliedClientName,
  };
}
