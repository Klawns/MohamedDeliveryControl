"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type User } from "@/hooks/use-auth";
import { rideKeys, settingsKeys } from "@/lib/query-keys";
import { settingsService } from "@/services/settings-service";
import { RIDES_PER_PAGE } from "../constants";
import { getUniqueRides } from "./mobile-dashboard-data.utils";
import { useInfiniteRides } from "./use-infinite-rides";
import { useMobileDashboardStats } from "./use-mobile-dashboard-stats";

export function useMobileDashboardData(user: User | null) {
    const queryClient = useQueryClient();
    const isEnabled = !!user;

    const {
        data: presets = [],
        isLoading: isLoadingPresets,
    } = useQuery({
        queryKey: settingsKeys.presets(),
        queryFn: ({ signal }) => settingsService.getRidePresets(signal),
        enabled: isEnabled,
    });

    const {
        data: historyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingHistory,
        isError: isHistoryError,
        refetch: refetchHistory,
        error: historyError,
    } = useInfiniteRides({
        limit: RIDES_PER_PAGE,
    }, {
        enabled: isEnabled,
    });

    const recentRides = useMemo(() => {
        const allRides = historyData?.pages.flatMap((page) => page.data || []) || [];
        return getUniqueRides(allRides);
    }, [historyData]);

    const stats = useMobileDashboardStats(isEnabled);

    const refreshData = useCallback(async () => {
        await Promise.all([
            queryClient.refetchQueries({
                queryKey: rideKeys.all,
                type: "active",
            }),
            queryClient.refetchQueries({
                queryKey: settingsKeys.all,
                type: "active",
            }),
        ]);
    }, [queryClient]);

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
        isStatsPending: stats.isPending,
        isStatsError: stats.isError,
        statsError: stats.error,
        refetchStats: stats.refetch,
        stats: stats.stats,
        refreshData,
    };
}
