"use client";

import { useState } from "react";
import type { User } from "@/hooks/use-auth";
import type { Period } from "./dashboard-stats.types";
import {
    useDashboardMonthStatsQuery,
    useDashboardStatsQuery,
} from "./use-dashboard-stats-query";

export function useDashboardStats(user: User | null) {
    const [period, setPeriod] = useState<Period>("today");

    const statsQuery = useDashboardStatsQuery(user, period);
    const monthStatsQuery = useDashboardMonthStatsQuery(user);

    return {
        period,
        setPeriod,
        stats: statsQuery.data?.data,
        monthRides: monthStatsQuery.data?.data?.rides,
        isPending: statsQuery.isPending || monthStatsQuery.isPending,
        isError: statsQuery.isError || monthStatsQuery.isError,
        error: statsQuery.error ?? monthStatsQuery.error ?? null,
        fetchStats: () =>
            Promise.all([statsQuery.refetch(), monthStatsQuery.refetch()]),
    };
}
