"use client";

import { useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useDeleteRidePresetMutation } from "@/hooks/mutations/use-delete-ride-preset-mutation";
import { useRidePaymentStatus } from "@/hooks/use-ride-payment-status";
import { parseApiError } from "@/lib/api-error";
import type { MobileDashboardProps } from "../types";
import { useClientSelection } from "./use-client-selection";
import { useMobileDashboardData } from "./use-mobile-dashboard-data";
import { useRideRegistration } from "./use-ride-registration";
import { useSelectedClient } from "./use-selected-client";

export function useMobileDashboardController({ onRideCreated }: MobileDashboardProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const paymentStatus = useRidePaymentStatus();
    const deletePresetMutation = useDeleteRidePresetMutation({
        onSuccess: async () => {
            toast({ title: "Preset removido" });
        },
        onError: async (error) => {
            toast({
                title: parseApiError(error, "Erro ao remover preset"),
                variant: "destructive",
            });
        },
    });

    const data = useMobileDashboardData(user);
    const selectedClientState = useSelectedClient();
    const rideRegistration = useRideRegistration({
        selectedClient: selectedClientState.selectedClient,
        onSelectionReset: selectedClientState.clearSelectedClient,
        onSuccess: async () => {
            await data.refreshData();
            await onRideCreated();
        },
    });
    const clientSelection = useClientSelection({
        onClientCreated: selectedClientState.setSelectedClient,
    });

    const handleDeletePreset = useCallback(
        async (presetId: string) => {
            await deletePresetMutation.mutateAsync(presetId);
        },
        [deletePresetMutation],
    );

    return {
        user,
        stats: {
            today: data.stats.today,
            week: data.stats.week,
            month: data.stats.month,
            isPending: data.isStatsPending,
            isError: data.isStatsError,
            error: data.statsError,
            refetch: data.refetchStats,
        },
        clients: {
            directory: clientSelection.directory,
            creationDialog: clientSelection.creationDialog,
            selectedClient: selectedClientState.selectedClient,
            selectClient: selectedClientState.setSelectedClient,
            createClient: clientSelection.creationDialog.submit,
        },
        rideForm: {
            presets: data.presets,
            form: rideRegistration.form,
            actions: rideRegistration.actions,
            deletePreset: handleDeletePreset,
        },
        recentRides: {
            rides: data.recentRides,
            isLoading: data.isLoadingHistory || data.isFetchingNextPage,
            hasMore: !!data.hasNextPage,
            loadMore: data.fetchNextPage,
            error: data.historyError,
            retry: data.refetchHistory,
            editRide: rideRegistration.modals.setRideToEdit,
            deleteRide: rideRegistration.modals.setRideToDelete,
            setPaymentStatus: paymentStatus.setPaymentStatus,
            isUpdatingRide: paymentStatus.isUpdatingRide,
        },
        dialogs: {
            rideToEdit: rideRegistration.modals.rideToEdit,
            closeRideEditor: () => rideRegistration.modals.setRideToEdit(null),
            rideToDelete: rideRegistration.modals.rideToDelete,
            closeRideDelete: () => rideRegistration.modals.setRideToDelete(null),
            confirmRideDelete: rideRegistration.modals.handleDeleteRide,
            isDeletingRide: rideRegistration.modals.isDeleting,
            refreshData: data.refreshData,
        },
    };
}
