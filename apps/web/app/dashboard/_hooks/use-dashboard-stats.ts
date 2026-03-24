"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/hooks/use-auth";
import { ridesService } from "@/services/rides-service";
import { rideKeys } from "@/lib/query-keys";
import { Ride } from "@/types/rides";

export type Period = 'today' | 'week';

interface DashboardStats {
    count: number;
    totalValue: number;
    rides: Ride[];
}

export function useDashboardStats(user: User | null) {
    const [period, setPeriod] = useState<Period>('today');

    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: rideKeys.stats(period),
        queryFn: ({ signal }) => ridesService.getStats({ period }, signal),
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 min
    });

    const { data: monthData, isLoading: isMonthLoading } = useQuery({
        queryKey: rideKeys.stats('month'),
        queryFn: ({ signal }) => ridesService.getStats({ period: 'month' }, signal),
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 min
    });

    return {
        period,
        setPeriod,
        stats: statsData?.data || { count: 0, totalValue: 0, rides: [] },
        monthRides: monthData?.data?.rides || [],
        isLoading: isStatsLoading || isMonthLoading,
    };
}
