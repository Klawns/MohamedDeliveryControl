"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ridesService } from "@/services/rides-service";
import { RIDES_PER_PAGE } from "../constants";
import { useInfiniteRides } from "./use-infinite-rides";

export function useMobileDashboardData(user: any) {
    const queryClient = useQueryClient();

    // Query para Presets
    const { 
        data: presetsData = [], 
        isLoading: isLoadingPresets,
    } = useQuery({
        queryKey: ["ride-presets"],
        queryFn: () => ridesService.getRidePresets(),
        enabled: !!user,
    });
    
    const presets = useMemo(() => presetsData, [presetsData]);
    
    // Infinite Query para Histórico (Recentes)
    const {
        data: historyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingHistory,
        isError: isHistoryError,
        refetch: refetchHistory,
        error: historyError
    } = useInfiniteRides({
        limit: RIDES_PER_PAGE
    });

    const recentRides = useMemo(() => {
        const allRides = historyData?.pages.flatMap(page => page.data || []) || [];
        return Array.from(new Map(
            allRides
                .filter(r => r && r.id)
                .map(r => [String(r.id), r])
        ).values());
    }, [historyData]);

    // Queries para Estatísticas (Hoje, Semana, Mês)
    const todayStats = useQuery({
        queryKey: ["dashboard-stats", "today"],
        queryFn: ({ signal }) => ridesService.getStats({ period: "today" }, signal),
        enabled: !!user,
        staleTime: 600000, 
        gcTime: 1200000,
    });

    const weekStats = useQuery({
        queryKey: ["dashboard-stats", "week"],
        queryFn: ({ signal }) => ridesService.getStats({ period: "week" }, signal),
        enabled: !!user,
        staleTime: 600000,
        gcTime: 1200000,
    });

    const monthStats = useQuery({
        queryKey: ["dashboard-stats", "month"],
        queryFn: ({ signal }) => ridesService.getStats({ period: "month" }, signal),
        enabled: !!user,
        staleTime: 600000, // 10 minutos
        gcTime: 1200000,   // 20 minutos
    });

    const isLoadingStats = todayStats.isLoading || weekStats.isLoading || monthStats.isLoading;

    const stats = useMemo(() => ({
        today: todayStats.data?.data?.totalValue || 0,
        week: weekStats.data?.data?.totalValue || 0,
        month: monthStats.data?.data?.totalValue || 0,
        monthRides: monthStats.data?.data?.rides || []
    }), [todayStats.data, weekStats.data, monthStats.data]);

    const refreshData = useCallback(async () => {
        console.log("[useMobileDashboardData] Refreshing all data...");
        // Invalida todas as queries de estatísticas
        await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        // Invalida a query infinita de corridas
        await queryClient.invalidateQueries({ queryKey: ["rides-infinite"] });
        // Invalida presets
        await queryClient.invalidateQueries({ queryKey: ["ride-presets"] });
        // Refetch manual do histórico para garantir re-render imediato
        refetchHistory();
    }, [queryClient, refetchHistory]);

    return {
        presets,
        isLoadingPresets,
        recentRides,
        isLoadingHistory,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        isHistoryError,
        historyError,
        refetchHistory,
        isLoadingStats,
        stats,
        refreshData
    };
}
