"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ridesService } from "@/services/rides-service";
import { Ride } from "@/types/rides";

interface UseRidesModalsProps {
    onSuccess: () => Promise<void>;
}

export function useRidesModals({ onSuccess }: UseRidesModalsProps) {
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [selectedQuickClient, setSelectedQuickClient] = useState<{ id: string, name: string } | null>(null);
    const [rideToEdit, setRideToEdit] = useState<Ride | null>(null);
    const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleEditRide = useCallback((ride: Ride) => {
        setRideToEdit(ride);
        setIsRideModalOpen(true);
    }, []);

    const handleDeleteRide = useCallback(async () => {
        if (!rideToDelete) return;

        setIsDeleting(true);
        try {
            await ridesService.deleteRide(rideToDelete.id);
            toast({
                title: "Corrida excluída",
                description: "A corrida foi removida com sucesso.",
            });
            await onSuccess();
            setRideToDelete(null);
        } catch (err) {
            console.error("Erro ao excluir corrida", err);
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir a corrida. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    }, [rideToDelete, toast, onSuccess]);

    const openCreateModal = useCallback(() => {
        setRideToEdit(null);
        setSelectedQuickClient(null);
        setIsRideModalOpen(true);
    }, []);

    const openQuickCreateModal = useCallback((id: string, name: string) => {
        setSelectedQuickClient({ id, name });
        setRideToEdit(null);
        setIsRideModalOpen(true);
    }, []);

    const closeRideModal = useCallback(() => {
        setIsRideModalOpen(false);
        setRideToEdit(null);
        setSelectedQuickClient(null);
    }, []);

    return {
        isRideModalOpen,
        setIsRideModalOpen,
        selectedQuickClient,
        setSelectedQuickClient,
        rideToEdit,
        setRideToEdit,
        rideToDelete,
        setRideToDelete,
        isDeleting,
        handleEditRide,
        handleDeleteRide,
        openCreateModal,
        openQuickCreateModal,
        closeRideModal
    };
}
