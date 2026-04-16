'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeClientCachesByIds } from '@/lib/client-cache';
import { clientKeys, financeKeys, rideKeys } from '@/lib/query-keys';
import { removeRideCachesByClient } from '@/lib/ride-cache';
import { clientsService } from '@/services/clients-service';
import type { BulkDeleteClientsResult, Client } from '@/types/rides';

type ClientBulkDeletionQueryClient = Pick<
  ReturnType<typeof useQueryClient>,
  'invalidateQueries'
>;

interface UseDeleteClientsMutationOptions {
  onSuccess?: (
    result: BulkDeleteClientsResult,
    clients: Client[],
  ) => Promise<void> | void;
  onError?: (error: unknown, clients: Client[]) => Promise<void> | void;
}

export async function invalidateClientCachesAfterBulkDeletion(
  queryClient: ClientBulkDeletionQueryClient,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: clientKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: clientKeys.directories() }),
    queryClient.invalidateQueries({ queryKey: [...rideKeys.all, 'stats'] }),
    queryClient.invalidateQueries({ queryKey: rideKeys.frequentClients() }),
    queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  ]);
}

export function useDeleteClientsMutation(
  options?: UseDeleteClientsMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clients: Client[]) => {
      const ids = Array.from(
        new Set(clients.map((client) => client.id).filter(Boolean)),
      );
      return clientsService.deleteClients(ids);
    },
    onSuccess: async (result, clients) => {
      const clientIds = clients.map((client) => client.id);

      removeClientCachesByIds(queryClient, clientIds);

      for (const clientId of clientIds) {
        removeRideCachesByClient(queryClient, clientId);
      }

      void invalidateClientCachesAfterBulkDeletion(queryClient);
      await options?.onSuccess?.(result, clients);
    },
    onError: async (error, clients) => {
      await options?.onError?.(error, clients);
    },
  });
}
