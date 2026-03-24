"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsService } from "@/services/clients-service";
import { ridesService } from "@/services/rides-service";
import { clientKeys, rideKeys } from "@/lib/query-keys";
import { parseApiError } from "@/lib/api-error";
import { toast } from "sonner"; // Assuming sonner is the standard here

export function useClientActions() {
    const queryClient = useQueryClient();

    const { mutateAsync: togglePin, isPending: isTogglingPin } = useMutation({
        mutationFn: ({ clientId, isPinned }: { clientId: string, isPinned: boolean }) => 
            clientsService.togglePin(clientId, isPinned),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            toast.success("Cliente fixado/desfixado!");
        },
        onError: (err) => {
            toast.error(parseApiError(err, "Erro ao alterar fixação do cliente."));
        }
    });

    const { mutateAsync: closeDebt, isPending: isSettling } = useMutation({
        mutationFn: (clientId: string) => clientsService.closeDebt(clientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            queryClient.invalidateQueries({ queryKey: rideKeys.all });
            toast.success("Dívida fechada e pagamento registrado!");
        },
        onError: (err) => {
            toast.error(parseApiError(err, "Erro ao fechar dívida."));
        }
    });

    const { mutateAsync: deleteClient, isPending: isDeleting } = useMutation({
        mutationFn: (clientId: string) => clientsService.deleteClient(clientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            queryClient.invalidateQueries({ queryKey: rideKeys.all });
            toast.success("Cliente excluído com sucesso.");
        },
        onError: (err) => {
            toast.error(parseApiError(err, "Erro ao excluir cliente. Verifique pendências."));
        }
    });

    const { mutateAsync: deleteRide, isPending: isDeletingRide } = useMutation({
        mutationFn: (rideId: string) => ridesService.deleteRide(rideId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rideKeys.all });
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            toast.success("Corrida excluída com sucesso.");
        },
        onError: (err) => {
            toast.error(parseApiError(err, "Erro ao excluir corrida."));
        }
    });

    return {
        isSettling,
        isDeleting,
        isDeletingRide,
        isTogglingPin,
        togglePin: async (clientId: string, isPinned: boolean) => {
            try { await togglePin({ clientId, isPinned }); return true; } catch { return false; }
        },
        closeDebt: async (clientId: string) => {
            try { await closeDebt(clientId); return true; } catch { return false; }
        },
        deleteClient: async (clientId: string) => {
            try { await deleteClient(clientId); return true; } catch { return false; }
        },
        deleteRide: async (rideId: string) => {
            try { await deleteRide(rideId); return true; } catch { return false; }
        }
    };
}
