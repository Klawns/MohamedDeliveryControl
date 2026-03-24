"use client";

import { useDashboard } from "./_hooks/use-dashboard";
import { DashboardMobileView } from "./_components/mobile-view";
import { DashboardDesktopView } from "./_components/desktop-view";
import { DashboardModals } from "./_components/dashboard-modals";

/**
 * Página Principal do Dashboard.
 * 
 * Agora atua como um orquestrador de alto nível que:
 * 1. Consome a lógica centralizada no hook useDashboard.
 * 2. Alterna entre visualizações Mobile e Desktop.
 * 3. Delega o gerenciamento de modais para um componente especializado.
 */
export default function DashboardPage() {
    const dashboard = useDashboard();

    // 1. Visão Otimizada para Mobile
    if (dashboard.isMobile) {
        return (
            <DashboardMobileView 
                user={dashboard.user}
                period={dashboard.period}
                stats={dashboard.stats}
                onRideCreated={dashboard.fetchStats}
            />
        );
    }

    // 2. Visão Otimizada para Desktop
    return (
        <div className="relative">
            <DashboardDesktopView 
                user={dashboard.user}
                period={dashboard.period}
                setPeriod={dashboard.setPeriod}
                stats={dashboard.stats}
                monthRides={dashboard.monthRides}
                isLoading={dashboard.isLoading}
                handleEditRide={dashboard.handleEditRide}
                setRideToDelete={dashboard.setRideToDelete}
            />

            {/* 3. Gerenciamento Centralizado de Modais */}
            <DashboardModals 
                isRideModalOpen={dashboard.isRideModalOpen}
                setIsRideModalOpen={dashboard.setIsRideModalOpen}
                rideToEdit={dashboard.rideToEdit}
                setRideToEdit={dashboard.setRideToEdit}
                rideToDelete={dashboard.rideToDelete}
                setRideToDelete={dashboard.setRideToDelete}
                isDeletingRide={dashboard.isDeletingRide}
                onDeleteConfirm={dashboard.handleDeleteRide}
                onSuccess={dashboard.fetchStats}
            />
        </div>
    );
}
