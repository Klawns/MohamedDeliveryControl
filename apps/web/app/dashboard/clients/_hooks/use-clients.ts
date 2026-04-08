"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { clientKeys } from "@/lib/query-keys";
import { clientsService } from "@/services/clients-service";

function dedupeClients<T extends { id?: string | null }>(items: T[]) {
    return Array.from(
        new Map(
            items
                .filter((item): item is T & { id: string } => Boolean(item?.id))
                .map((item) => [String(item.id), item]),
        ).values(),
    );
}

export function useClients() {
    const [search, setSearch] = useState('');
    const limit = 16;
    const filters = useMemo(() => ({ search, limit }), [search, limit]);

    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
        error,
    } = useInfiniteQuery({
        queryKey: clientKeys.infinite(filters),
        queryFn: ({ pageParam, signal }) => clientsService.getClients({
            ...filters,
            cursor: pageParam as string | undefined,
        }, signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.meta?.hasNextPage ? lastPage.meta.nextCursor : undefined,
        staleTime: 300000,
        gcTime: 600000,
    });

    const allClients = data?.pages.flatMap((page) => page.data || []) || [];
    const clients = dedupeClients(allClients);
    const totalCount = data?.pages[0]?.meta?.total ?? clients.length;

    return {
        clients,
        search,
        setSearch,
        isLoading,
        isFetching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        totalCount,
        limit,
        error,
        fetchClients: refetch,
    };
}
