import { useInfiniteQuery } from "@tanstack/react-query";
import { ridesService } from "@/services/rides-service";
import { RidesParams } from "@/types/rides";

export function useInfiniteRides(params: Omit<RidesParams, "cursor">) {
    return useInfiniteQuery({
        queryKey: ["rides-infinite", params],
        queryFn: ({ pageParam }) => ridesService.getRides({ 
            ...params, 
            cursor: pageParam 
        }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.meta?.nextCursor,
    });
}
