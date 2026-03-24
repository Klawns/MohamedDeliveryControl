"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useClients } from "@/providers/clients-provider";
import { financeService } from "@/services/finance-service";
import { PeriodId, Period, PERIODS } from "../_types";

export interface FinanceFiltersState {
  period: PeriodId;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export function useFinanceDashboard() {
    const { user } = useAuth();
    const { clients } = useClients();
    
    // Filtros em um único estado para facilitar o setFilters
    const [filters, setFiltersState] = useState<FinanceFiltersState>({
        period: "month",
        clientId: "all",
    });

    const setFilters = (newFilters: Partial<FinanceFiltersState>) => {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
    };

    // Query unificada para o dashboard
    const { 
        data: dashboardData = null, 
        isLoading,
        isFetching,
        refetch
    } = useQuery({
        queryKey: ["finance-dashboard", filters.period, filters.clientId, filters.startDate, filters.endDate],
        queryFn: ({ signal }) => financeService.getDashboard({
            period: filters.period,
            clientId: filters.clientId !== "all" ? filters.clientId : undefined,
            start: filters.period === "custom" ? filters.startDate : undefined,
            end: filters.period === "custom" ? filters.endDate : undefined,
        }, signal),
        enabled: !!user && (filters.period !== "custom" || (!!filters.startDate && !!filters.endDate)),
        staleTime: 60000, 
    });

    const currentPeriod: Period = useMemo(() => 
        PERIODS.find((p) => p.id === filters.period) || PERIODS[0]
    , [filters.period]);

    return {
        user,
        clients,
        data: dashboardData,
        isLoading,
        isFetching,
        refetch,
        currentPeriod,
        filters,
        setFilters
    };
}
