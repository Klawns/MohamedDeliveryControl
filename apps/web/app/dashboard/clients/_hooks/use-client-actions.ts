'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDeleteRideMutation } from '@/hooks/mutations/use-delete-ride-mutation';
import { useDeleteRidesMutation } from '@/hooks/mutations/use-delete-rides-mutation';
import { isApiErrorStatus, parseApiError } from '@/lib/api-error';
import { removeClientCaches, upsertClientCaches } from '@/lib/client-cache';
import { clientKeys, financeKeys, rideKeys } from '@/lib/query-keys';
import {
  invalidateRideCachesForClient,
  removeRideCachesByClient,
} from '@/lib/ride-cache';
import { formatCurrency } from '@/lib/utils';
import { clientsService } from '@/services/clients-service';
import { type Client, type RideViewModel } from '@/types/rides';

const STALE_CLIENT_MESSAGE =
  'Os dados deste cliente ficaram desatualizados. Recarregamos a tela para sincronizar.';

type ClientActionResult =
  | { success: true }
  | { success: false; reason: 'missing-client' | 'error' };

export function useClientActions() {
  const queryClient = useQueryClient();

  const togglePinMutation = useMutation({
    mutationFn: (client: Client) => clientsService.togglePin(client.id, !!client.isPinned),
    onSuccess: async (updatedClient) => {
      upsertClientCaches(queryClient, updatedClient);
      await queryClient.invalidateQueries({ queryKey: clientKeys.directories() });

      toast.success('Cliente fixado/desfixado!');
    },
    onError: (error) => {
      toast.error(parseApiError(error, 'Erro ao alterar fixacao do cliente.'));
    },
  });

  const closeDebtMutation = useMutation({
    mutationFn: (clientId: string) => clientsService.closeDebt(clientId),
    onSuccess: async (result, clientId) => {
      await invalidateRideCachesForClient(queryClient, clientId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId), exact: true }),
        queryClient.invalidateQueries({ queryKey: clientKeys.balance(clientId), exact: true }),
        queryClient.invalidateQueries({ queryKey: clientKeys.payments(clientId) }),
        queryClient.invalidateQueries({ queryKey: financeKeys.all }),
      ]);

      toast.success(
        result.generatedBalance > 0
          ? `Divida fechada. ${result.settledRides} corridas quitadas e ${formatCurrency(result.generatedBalance)} em saldo.`
          : `Divida fechada. ${result.settledRides} corridas quitadas.`,
      );
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => clientsService.deleteClient(clientId),
    onSuccess: async (_, clientId) => {
      removeClientCaches(queryClient, clientId);
      removeRideCachesByClient(queryClient, clientId);

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: clientKeys.directories() }),
        queryClient.invalidateQueries({ queryKey: [...rideKeys.all, 'stats'] }),
        queryClient.invalidateQueries({ queryKey: financeKeys.all }),
      ]);

      toast.success('Cliente excluido com sucesso.');
    },
    onError: (error) => {
      toast.error(parseApiError(error, 'Erro ao excluir cliente. Verifique pendencias.'));
    },
  });

  const deleteRideMutation = useDeleteRideMutation({
    onSuccess: async () => {
      toast.success('Corrida excluida com sucesso.');
    },
    onError: async (error) => {
      toast.error(parseApiError(error, 'Erro ao excluir corrida.'));
    },
  });

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
    isSettling: closeDebtMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
    isDeletingRide: deleteRideMutation.isPending,
    isDeletingRides: deleteRidesMutation.isPending,
    isTogglingPin: togglePinMutation.isPending,
    togglePin: async (client: Client) => {
      try {
        await togglePinMutation.mutateAsync(client);
        return true;
      } catch {
        return false;
      }
    },
    closeDebt: async (clientId: string): Promise<ClientActionResult> => {
      try {
        await closeDebtMutation.mutateAsync(clientId);
        return { success: true };
      } catch (error) {
        if (isApiErrorStatus(error, 404)) {
          removeClientCaches(queryClient, clientId);
          removeRideCachesByClient(queryClient, clientId);
          toast.error(STALE_CLIENT_MESSAGE);
          return { success: false, reason: 'missing-client' };
        }

        toast.error(parseApiError(error, 'Erro ao fechar divida.'));
        return { success: false, reason: 'error' };
      }
    },
    deleteClient: async (clientId: string) => {
      try {
        await deleteClientMutation.mutateAsync(clientId);
        return true;
      } catch {
        return false;
      }
    },
    deleteRide: async (ride: RideViewModel) => {
      try {
        await deleteRideMutation.mutateAsync(ride);
        return true;
      } catch {
        return false;
      }
    },
    deleteRides: async (rides: RideViewModel[]) => {
      try {
        const result = await deleteRidesMutation.mutateAsync(rides);
        return { success: true as const, result };
      } catch {
        return { success: false as const };
      }
    },
  };
}
