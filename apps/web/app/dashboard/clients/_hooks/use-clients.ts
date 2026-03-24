"use client";

import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { clientsService } from "@/services/clients-service";
import { clientKeys } from "@/lib/query-keys";
import { Client } from "@/types/rides";

export function useClients() {
    const [search, setSearch] = useState("");
    const limit = 16; // Aumentado conforme análise do usuário
    const filters = useMemo(() => ({ search, limit }), [search, limit]);

    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: clientKeys.infinite(filters),
        queryFn: ({ pageParam, signal }) => clientsService.getClients({
            ...filters,
            cursor: pageParam as string | undefined
        }, signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
        staleTime: 300000, // 5 minutos
        gcTime: 600000,   // 10 minutos
    });

    const allClients = data?.pages.flatMap(page => {
        // Validação temporária durante transição V2
        if (!Array.isArray(page.data)) {
            console.error('Formato inválido em page.data', page);
            return [];
        }
        return page.data;
    }) || [];
    // Deduplicação robusta por ID (garantindo string e removendo undefined)
    const clients = Array.from(new Map(
        allClients
            .filter(c => c && c.id)
            .map(c => [String(c.id), c])
    ).values());
    const total = data?.pages[0]?.meta?.total || 0;

    return {
        clients,
        search,
        setSearch,
        isLoading,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        total,
        limit,
        fetchClients: refetch
    };
}
