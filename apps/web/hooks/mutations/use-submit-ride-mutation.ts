'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertRideCaches } from '@/lib/ride-cache';
import { authKeys, clientKeys, financeKeys, rideKeys } from '@/lib/query-keys';
import {
  submitRideDraft,
  type RideSubmissionDraft,
} from '@/components/ride-modal/lib/ride-submission';
import { type RideViewModel } from '@/types/rides';

export interface SubmitRideMutationVariables {
  draft: RideSubmissionDraft;
  rideToEdit?: RideViewModel | null;
}

interface UseSubmitRideMutationOptions {
  onSuccess?: (
    ride: RideViewModel,
    variables: SubmitRideMutationVariables,
  ) => Promise<void> | void;
  onError?: (
    error: unknown,
    variables: SubmitRideMutationVariables,
  ) => Promise<void> | void;
}

export function useSubmitRideMutation(
  options?: UseSubmitRideMutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draft, rideToEdit }: SubmitRideMutationVariables) =>
      submitRideDraft(draft, rideToEdit),
    onSuccess: async (ride, variables) => {
      upsertRideCaches(queryClient, ride);

      const affectedClientIds = Array.from(
        new Set(
          [
            ride.clientId,
            variables.draft.selectedClientId,
            variables.rideToEdit?.clientId,
          ]
            .filter((value): value is string => Boolean(value)),
        ),
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rideKeys.all }),
        ...affectedClientIds.flatMap((clientId) => [
          queryClient.invalidateQueries({
            queryKey: clientKeys.detail(clientId),
            exact: true,
          }),
          queryClient.invalidateQueries({
            queryKey: clientKeys.balance(clientId),
            exact: true,
          }),
        ]),
        queryClient.invalidateQueries({ queryKey: financeKeys.all }),
        queryClient.invalidateQueries({
          queryKey: authKeys.user(),
          exact: true,
        }),
      ]);

      await options?.onSuccess?.(ride, variables);
    },
    onError: async (error, variables) => {
      await options?.onError?.(error, variables);
    },
  });
}
