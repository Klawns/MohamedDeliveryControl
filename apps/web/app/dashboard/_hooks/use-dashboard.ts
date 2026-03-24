"use client";

import { useAuth } from "@/hooks/use-auth";
import { useDashboardAuth } from "./use-dashboard-auth";
import { usePaymentToast } from "./use-payment-toast";
import { useDashboardUI } from "./use-dashboard-ui";
import { useDashboardStats } from "./use-dashboard-stats";
import { useDashboardRides } from "./use-dashboard-rides";

/**
 * Hook principal do Dashboard (Facade).
 * 
 * Este hook agora funciona como um HUB de composição, delegando responsabilidades
 * para hooks menores e especializados. Segue o princípio de responsabilidade única (SRP)
 * e facilita a manutenção e escalabilidade do código.
 */
export function useDashboard() {
    const { user } = useAuth();

    // 1. Efeitos Colaterais Independentes
    useDashboardAuth({ user });
    usePaymentToast();

    // 2. Estado da Interface e Dispositivo
    const ui = useDashboardUI();

    // 3. Gerenciamento de Dados e Estatísticas
    const stats = useDashboardStats(user);

    // 4. Ações e Lógica de Negócio (Corridas)
    const rides = useDashboardRides({
        onRideDeleted: stats.fetchStats // Atualiza os dados após exclusão bem-sucedida
    });

    return {
        // Auth
        user,

        // Stats & Data
        period: stats.period,
        setPeriod: stats.setPeriod,
        stats: stats.stats,
        monthRides: stats.monthRides,
        isLoading: stats.isLoading,
        fetchStats: stats.fetchStats,

        // UI & Device
        isMobile: ui.isMobile,

        // Ride Actions
        isRideModalOpen: rides.isRideModalOpen,
        setIsRideModalOpen: rides.setIsRideModalOpen,
        rideToEdit: rides.rideToEdit,
        setRideToEdit: rides.setRideToEdit,
        rideToDelete: rides.rideToDelete,
        setRideToDelete: rides.setRideToDelete,
        isDeletingRide: rides.isDeletingRide,
        handleEditRide: rides.handleEditRide,
        handleDeleteRide: rides.handleDeleteRide
    };
}
