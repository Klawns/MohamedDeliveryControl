'use client';

import { toast } from 'sonner';
import { useDeleteClientsMutation } from '@/hooks/mutations/use-delete-clients-mutation';
import { parseApiError } from '@/lib/api-error';
import type { BulkDeleteClientsResult, Client } from '@/types/rides';

export function useDeleteClientsAction() {
  const deleteClientsMutation = useDeleteClientsMutation({
    onSuccess: async (result) => {
      const deletedLabel =
        result.deletedCount === 1
          ? '1 cliente excluido com sucesso.'
          : `${result.deletedCount} clientes excluidos com sucesso.`;

      toast.success(deletedLabel);
    },
    onError: async (error) => {
      toast.error(parseApiError(error, 'Erro ao excluir clientes.'));
    },
  });

  return {
    isDeletingClients: deleteClientsMutation.isPending,
    deleteClients: async (
      clients: Client[],
    ): Promise<
      | { success: true; result: BulkDeleteClientsResult }
      | { success: false }
    > => {
      try {
        const result = await deleteClientsMutation.mutateAsync(clients);
        return { success: true, result };
      } catch {
        return { success: false };
      }
    },
  };
}
