"use client";

import { RideModal } from "@/components/ride-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { Ride } from "@/types/rides";

interface DashboardModalsProps {
    isRideModalOpen: boolean;
    setIsRideModalOpen: (open: boolean) => void;
    rideToEdit: Ride | null;
    setRideToEdit: (ride: Ride | null) => void;
    rideToDelete: Ride | null;
    setRideToDelete: (ride: Ride | null) => void;
    isDeletingRide: boolean;
    onDeleteConfirm: () => Promise<void>;
    onSuccess: () => void;
}

/**
 * Componente que orquestra todos os modais da página de Dashboard.
 * Centraliza a lógica de abertura/fechamento e callbacks.
 */
export function DashboardModals({
    isRideModalOpen,
    setIsRideModalOpen,
    rideToEdit,
    setRideToEdit,
    rideToDelete,
    setRideToDelete,
    isDeletingRide,
    onDeleteConfirm,
    onSuccess
}: DashboardModalsProps) {
    return (
        <>
            <RideModal
                isOpen={isRideModalOpen}
                onClose={() => {
                    setIsRideModalOpen(false);
                    setRideToEdit(null);
                }}
                onSuccess={onSuccess}
                rideToEdit={rideToEdit}
            />

            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={() => setRideToDelete(null)}
                onConfirm={onDeleteConfirm}
                title="Excluir Corrida"
                description="Deseja realmente excluir esta corrida?"
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeletingRide}
            />
        </>
    );
}
