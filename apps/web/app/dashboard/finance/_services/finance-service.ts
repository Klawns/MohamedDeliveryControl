import { apiClient } from "@/services/api";
import { FinanceStats, PeriodId } from "../_types";

export interface FetchStatsParams {
    period: PeriodId;
    clientId?: string;
    startDate?: string;
    endDate?: string;
}

function buildStatsPath(params: FetchStatsParams): string {
    const searchParams = new URLSearchParams();
    searchParams.append("period", params.period);

    if (params.clientId && params.clientId !== "all") {
        searchParams.append("clientId", params.clientId);
    }

    if (params.period === "custom" && params.startDate && params.endDate) {
        searchParams.append("start", params.startDate);
        searchParams.append("end", params.endDate);
    }

    return `/rides/stats?${searchParams.toString()}`;
}

export const financeService = {
    async fetchStats(params: FetchStatsParams): Promise<FinanceStats> {
        const path = buildStatsPath(params);
        return apiClient.get<FinanceStats>(path);
    },
};
