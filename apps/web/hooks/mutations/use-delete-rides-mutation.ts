'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientKeys, financeKeys, rideKeys } from '@/lib/query-keys';
import { removeRideCachesByIds } from '@/lib/ride-cache';
import { ridesService } from '@/services/rides-service';
import type { BulkDeleteRidesResult, RideViewModel } from '@/types/rides';

type RideBulkDeletionQueryClient = Pick<
  ReturnType<typeof useQueryClient>,
  'invalidateQueries'
>;

interface UseDeleteRidesMutationOptions {
  onSuccess?: (
    result: BulkDeleteRidesResult,
    rides: RideViewModel[],
  ) => Promise<void> | void;
  onError?: (error: unknown, rides: RideViewModel[]) => Promise<void> | void;
}

export async function invalidateRideCachesAfterBulkDeletion(
  queryClient: RideBulkDeletionQueryClient,
  clientIds: string[],
) {
  const uniqueClientIds = Array.from(
    new Set(clientIds.filter((clientId) => Boolean(clientId))),
  );

  const tasks: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({ queryKey: [...rideKeys.all, 'stats'] }),
    queryClient.invalidateQueries({ queryKey: rideKeys.frequentClients() }),
    queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  ];

  for (const clientId of uniqueClientIds) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(clientId),
        exact: true,
      }),
    );
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: clientKeys.balance(clientId),
        exact: true,
      }),
    );
  }

  await Promise.all(tasks);
}

export function useDeleteRidesMutation(
  options?: UseDeleteRidesMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rides: RideViewModel[]) => {
      const ids = Array.from(new Set(rides.map((ride) => ride.id).filter(Boolean)));
      return ridesService.deleteRides(ids);
    },
    onSuccess: async (result, rides) => {
      removeRideCachesByIds(
        queryClient,
        rides.map((ride) => ride.id),
      );
      void invalidateRideCachesAfterBulkDeletion(
        queryClient,
        rides.map((ride) => ride.clientId ?? ''),
      );
      await options?.onSuccess?.(result, rides);
    },
    onError: async (error, rides) => {
      await options?.onError?.(error, rides);
    },
  });
}
