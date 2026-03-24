import { useInfiniteQuery } from "@tanstack/react-query";
import { clientsService } from "@/services/clients-service";
import { clientKeys } from "@/lib/query-keys";

export function useInfiniteClients(params: { limit: number; search?: string }) {
    return useInfiniteQuery({
        queryKey: clientKeys.infinite(params),
        queryFn: ({ pageParam }) => clientsService.getClients({ 
            ...params, 
            cursor: pageParam 
        }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
    });
}
