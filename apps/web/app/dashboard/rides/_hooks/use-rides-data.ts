"use client";

import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useClients } from "@/providers/clients-provider";
import { ridesService } from "@/services/rides-service";
import { Ride, RidesFilterState } from "@/types/rides";
import { toast } from "sonner";
import { rideKeys } from "@/lib/query-keys";

interface UseRidesDataProps {
    filters: RidesFilterState;
    pageSize: number;
}

export function useRidesData({ filters, pageSize }: UseRidesDataProps) {
    const { user } = useAuth();
    const { clients } = useClients();
    const queryClient = useQueryClient();

    // Query filters object for keys - wrapped in useMemo for stability
    const activeFilters = useMemo(() => ({
        limit: pageSize,
        paymentStatus: filters.paymentFilter !== "all" ? filters.paymentFilter : undefined,
        clientId: filters.clientFilter !== "all" ? filters.clientFilter : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined
    }), [pageSize, filters]);

    // Infinite Query para buscar corridas
    const { 
        data: ridesData, 
        isLoading: isRidesLoading,
        isFetching: isRidesFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error: ridesError,
        refetch: fetchRides 
    } = useInfiniteQuery({
        queryKey: rideKeys.infinite(activeFilters),
        queryFn: ({ pageParam, signal }) => ridesService.getRides({
            ...activeFilters,
            cursor: pageParam as string | undefined,
        }, signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
        enabled: !!user,
        staleTime: 120000, // 2 minutos
        gcTime: 300000,   // 5 minutos
    });

    const allRides = ridesData?.pages.flatMap(page => page.data) || [];
    // Deduplicação robusta por ID (garantindo string e removendo undefined)
    const rides = Array.from(new Map(
        allRides
            .filter(r => r && r.id)
            .map(r => [String(r.id), r])
    ).values());
    const totalCount = ridesData?.pages[0]?.meta?.total || 0;

    // Query para buscar clientes frequentes (fixados)
    const { 
        data: frequentClients = [], 
        isLoading: isFrequentLoading,
        refetch: fetchFrequentClients
    } = useQuery({
        queryKey: rideKeys.lists(), // Clientes frequentes pode ficar agrupado em lists()
        queryFn: ({ signal }) => ridesService.getFrequentClients(signal),
        enabled: !!user,
    });

    // Mutação para atualizar status de pagamento
    const { mutateAsync: togglePaymentStatus } = useMutation({
        mutationFn: (ride: Ride) => {
            const newStatus = ride.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';
            return ridesService.updateRideStatus(ride.id, { paymentStatus: newStatus });
        },
        onSuccess: () => {
            toast.success("Status de pagamento atualizado");
            queryClient.invalidateQueries({ queryKey: ["rides-infinite"] });
            queryClient.invalidateQueries({ queryKey: ["rides-count"] });
        },
        onError: (error) => {
            console.error("[useRidesData] Erro ao atualizar status de pagamento", error);
            toast.error("Falha ao atualizar status de pagamento");
        }
    });

    return {
        rides,
        totalCount,
        clients,
        frequentClients,
        isLoading: isRidesLoading,
        isFetching: isRidesFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        isFrequentLoading,
        ridesError,
        fetchRides,
        fetchFrequentClients,
        togglePaymentStatus
    };
}
