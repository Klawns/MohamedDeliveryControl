"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { rideKeys, clientKeys } from "@/lib/query-keys";
import { clientsService } from "@/services/clients-service";
import { ridesService } from "@/services/rides-service";
import { Client, ClientBalance } from "@/types/rides";
import { PDFService } from "@/services/pdf-service";
import { useAuth } from "@/hooks/use-auth";
import { useExportClientDebt } from "./use-export-client-debt";

export function useClientDetailsData(client: Client | null) {
    const { user } = useAuth();
    const { exportToExcel } = useExportClientDebt();
    const rideLimit = 10;

    // 1. Corridas (Infinite Query)
    const {
        data: ridesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isRidesLoading,
        refetch: refetchRides
    } = useInfiniteQuery({
        queryKey: client ? rideKeys.byClient(client.id) : ['rides', 'byClient', 'null'],
        queryFn: ({ pageParam, signal }) => 
            ridesService.getRidesByClient(client!.id, { 
                limit: rideLimit, 
                cursor: pageParam as string | undefined 
            }, signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
        enabled: !!client,
        staleTime: 60000,
    });

    // 2. Saldo (Regular Query)
    const {
        data: balance,
        isLoading: isBalanceLoading,
        refetch: refetchBalance
    } = useQuery({
        queryKey: client ? clientKeys.detail(client.id) : ['clients', 'detail', 'null'],
        queryFn: () => clientsService.getClientBalance(client!.id),
        enabled: !!client,
        staleTime: 60000,
    });

    // 3. Pagamentos (Regular Query)
    const {
        data: payments = [],
        isLoading: isPaymentsLoading,
        refetch: refetchPayments
    } = useQuery({
        queryKey: client ? ['clients', 'payments', client.id] : ['clients', 'payments', 'null'],
        queryFn: () => clientsService.getClientPayments(client!.id),
        enabled: !!client,
        staleTime: 60000,
    });

    // Processar Corridas
    const rides = useMemo(() => {
        const allRides = ridesData?.pages.flatMap(page => page.data) || [];
        return Array.from(new Map(allRides.map(r => [r.id, r])).values());
    }, [ridesData]);

    const rideTotal = ridesData?.pages[0]?.meta?.total || 0;

    const refreshDetails = useCallback(() => {
        refetchRides();
        refetchBalance();
        refetchPayments();
    }, [refetchRides, refetchBalance, refetchPayments]);

    const generatePDF = async () => {
        if (!client || !balance) return;
        try {
            const response = await ridesService.getRidesByClient(client.id, { limit: 100 });
            PDFService.generateClientDebtReport(
                client,
                response.data,
                payments,
                balance,
                { userName: user?.name || "Motorista" }
            );
        } catch (err) {
            alert("Erro ao gerar PDF.");
        }
    };

    const generateExcel = async () => {
        if (!client || !balance) return;
        try {
            const response = await ridesService.getRidesByClient(client.id, { limit: 100 });
            exportToExcel(
                client,
                response.data,
                payments,
                balance,
                { userName: user?.name || "Motorista" }
            );
        } catch (err) {
            alert("Erro ao gerar Planilha.");
        }
    };

    return {
        rides,
        balance: balance || null,
        payments,
        rideTotal,
        rideLimit,
        isLoading: isRidesLoading || isBalanceLoading || isPaymentsLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refreshDetails,
        generatePDF,
        generateExcel
    };
}
