'use client';

import { toast } from 'sonner';
import { useDeleteRidesMutation } from '@/hooks/mutations/use-delete-rides-mutation';
import { parseApiError } from '@/lib/api-error';
import type { BulkDeleteRidesResult, RideViewModel } from '@/types/rides';

export function useDeleteRidesAction() {
  const deleteRidesMutation = useDeleteRidesMutation({
    onSuccess: async (result) => {
      const deletedLabel =
        result.deletedCount === 1
          ? '1 corrida excluida com sucesso.'
          : `${result.deletedCount} corridas excluidas com sucesso.`;

      toast.success(deletedLabel);
    },
    onError: async (error) => {
      toast.error(parseApiError(error, 'Erro ao excluir corridas.'));
    },
  });

  return {
    isDeletingRides: deleteRidesMutation.isPending,
    deleteRides: async (
      rides: RideViewModel[],
    ): Promise<
      | { success: true; result: BulkDeleteRidesResult }
      | { success: false }
    > => {
      try {
        const result = await deleteRidesMutation.mutateAsync(rides);
        return { success: true, result };
      } catch {
        return { success: false };
      }
    },
  };
}
