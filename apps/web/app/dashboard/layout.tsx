"use client";

import { useAuth } from "@/hooks/use-auth";
import { useLayoutAuth } from "./_hooks/use-layout-auth";
import { useLayoutSubscription } from "./_hooks/use-layout-subscription";
import { useSidebarState } from "./_hooks/use-sidebar-state";
import { ClientsProvider } from "@/providers/clients-provider";

import { Sidebar } from "./_components/layout/sidebar";
import { MobileHeader } from "./_components/layout/mobile-header";
import { StatusBanners } from "./_components/layout/status-banners";
import { PopupsManager } from "./_components/layout/popups-manager";

/**
 * DashboardLayout Refatorado.
 * 
 * Este componente agora serve apenas como orquestrador, delegando:
 * - Autenticação e Proteção -> useLayoutAuth
 * - Estados de Assinatura -> useLayoutSubscription
 * - Estado da Sidebar -> useSidebarState
 * - UI Components -> Sidebar, MobileHeader, StatusBanners, PopupsManager
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading, isAuthenticated, updateUser } = useAuth();
    
    // 1. Hooks de Lógica Especializada
    useLayoutAuth({ user, isLoading, isAuthenticated });
    const sub = useLayoutSubscription(user);
    const sidebar = useSidebarState(user);

    // Renderização de Loading Inicial
    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <ClientsProvider>
            <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
                {/* 2. Gerenciador de Modais e Popups */}
                <PopupsManager 
                    user={user}
                    isLoading={isLoading}
                    updateUser={updateUser}
                    showExpiringPopup={sub.showExpiringPopup}
                    daysRemaining={sub.daysRemaining}
                />

                {/* 3. Navegação (Sidebar) */}
                <Sidebar 
                    isOpen={sidebar.isSidebarOpen}
                    setIsOpen={sidebar.setIsSidebarOpen}
                    user={user}
                    menuItems={sidebar.menuItems}
                    logout={logout}
                />

                <main className="flex-1 relative overflow-y-auto flex flex-col min-w-0 scrollbar-hide">
                    {/* 4. Banners de Status de Assinatura */}
                    <StatusBanners 
                        isExpired={sub.isExpired}
                        isExpiringSoon={sub.isExpiringSoon}
                    />

                    {/* 5. Header Visível apenas em Mobile */}
                    <MobileHeader onOpenSidebar={sidebar.toggleSidebar} />

                    {/* 6. Conteúdo da Página */}
                    <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto flex-1">
                        {children}
                    </div>
                </main>
            </div>
        </ClientsProvider>
    );
}
