"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertClientCaches } from "@/lib/client-cache";
import { clientKeys } from "@/lib/query-keys";
import { type ClientFormPayload } from "@/mappers/client-form.mapper";
import { clientsService } from "@/services/clients-service";
import { type Client } from "@/types/rides";

export interface UpsertClientInput {
  clientId?: string;
  data: ClientFormPayload;
}

interface UseUpsertClientMutationOptions {
  onSuccess?: (
    client: Client,
    variables: UpsertClientInput,
  ) => Promise<void> | void;
  onError?: (
    error: unknown,
    variables: UpsertClientInput,
  ) => Promise<void> | void;
}

export function useUpsertClientMutation(
  options?: UseUpsertClientMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, data }: UpsertClientInput) =>
      clientId
        ? clientsService.updateClient(clientId, data)
        : clientsService.createClient(data),
    onSuccess: async (client, variables) => {
      upsertClientCaches(queryClient, client);
      await queryClient.invalidateQueries({
        queryKey: clientKeys.directories(),
      });
      await options?.onSuccess?.(client, variables);
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables);
    },
  });
}
