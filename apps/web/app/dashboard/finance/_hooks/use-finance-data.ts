"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useClients } from "@/providers/clients-provider";
import { ridesService } from "@/services/rides-service";
import { PeriodId, Period, PERIODS } from "../_types";

export function useFinanceData() {
    const { user } = useAuth();
    const { clients } = useClients();
    
    // Filtros
    const [selectedClientId, setSelectedClientId] = useState<string>("all");
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodId>("month");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // Query para buscar estatísticas
    const { 
        data: viewStats = null, 
        isLoading,
        isFetching,
        refetch
    } = useQuery({
        queryKey: ["dashboard-stats", selectedPeriod, selectedClientId, startDate, endDate],
        queryFn: () => ridesService.getStats({
            period: selectedPeriod,
            clientId: selectedClientId !== "all" ? selectedClientId : undefined,
            start: selectedPeriod === "custom" ? startDate : undefined,
            end: selectedPeriod === "custom" ? endDate : undefined,
        }),
        enabled: !!user && (selectedPeriod !== "custom" || (!!startDate && !!endDate)),
        staleTime: 60000, // Estatísticas podem ser cacheadas por 1 minuto
    });

    const currentPeriod: Period = PERIODS.find((p) => p.id === selectedPeriod) || PERIODS[0];

    return {
        user,
        clients,
        selectedClientId,
        setSelectedClientId,
        selectedPeriod,
        setSelectedPeriod,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        viewStats,
        isLoading,
        isFetching,
        refetch,
        currentPeriod,
    };
}
