"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { api, apiClient } from "@/services/api";
import { Ride } from "@/types/rides";

interface UseDashboardRidesProps {
    onRideDeleted?: () => void;
}

/**
 * Hook especializado para ações relacionadas a corridas (edição e exclusão).
 */
export function useDashboardRides({ onRideDeleted }: UseDashboardRidesProps = {}) {
    const { toast } = useToast();
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [rideToEdit, setRideToEdit] = useState<Ride | null>(null);
    const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
    const [isDeletingRide, setIsDeletingRide] = useState(false);

    const handleEditRide = (ride: Ride) => {
        setRideToEdit(ride);
        setIsRideModalOpen(true);
    };

    const handleDeleteRide = async () => {
        if (!rideToDelete) return;
        
        setIsDeletingRide(true);
        try {
            await apiClient.delete(`/rides/${rideToDelete.id}`);
            toast({ title: "Corrida excluída com sucesso" });
            
            if (onRideDeleted) {
                onRideDeleted();
            }
            
            setRideToDelete(null);
        } catch (err) {
            console.error("[DashboardRides] Erro ao excluir corrida:", err);
            toast({ 
                title: "Erro ao excluir corrida", 
                description: "Não foi possível completar a ação. Tente novamente.",
                variant: "destructive" 
            });
        } finally {
            setIsDeletingRide(false);
        }
    };

    return {
        isRideModalOpen,
        setIsRideModalOpen,
        rideToEdit,
        setRideToEdit,
        rideToDelete,
        setRideToDelete,
        isDeletingRide,
        handleEditRide,
        handleDeleteRide
    };
}
