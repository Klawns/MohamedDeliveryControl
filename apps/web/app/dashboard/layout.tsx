"use client";

import { useAuth } from "@/hooks/use-auth";
import { useLayoutAuth } from "./_hooks/use-layout-auth";
import { useLayoutSubscription } from "./_hooks/use-layout-subscription";
import { useSidebarState } from "./_hooks/use-sidebar-state";
import { cn } from "@/lib/utils";
import { QueryErrorState } from "@/components/query-error-state";

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
    const { user, logout, isLoading, isAuthenticated, isAuthError, authError, verify } = useAuth();
    
    // 1. Hooks de Lógica Especializada
    useLayoutAuth({ user, isLoading, isAuthenticated, isAuthError });
    const sub = useLayoutSubscription(user);
    const sidebar = useSidebarState(user);

    // Renderização de Loading Inicial
    if (isAuthError && authError) {
        return (
            <div className="min-h-dvh bg-background p-6">
                <QueryErrorState
                    error={authError}
                    title="Nao foi possivel validar sua sessao"
                    description="A autenticacao falhou por uma indisponibilidade operacional. Tente novamente."
                    onRetry={() => {
                        void verify();
                    }}
                    fullHeight
                />
            </div>
        );
    }

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-dvh bg-background flex items-center justify-center">
                <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-dvh min-h-dvh overflow-hidden overflow-x-clip bg-background text-foreground">
                {/* 2. Gerenciador de Modais e Popups */}
                <PopupsManager 
                    user={user}
                    isLoading={isLoading}
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

                <main
                    data-dashboard-scroll-root="true"
                    className={cn(
                        "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden scrollbar-hide",
                        sidebar.isSidebarOpen ? "lg:ml-72" : "lg:ml-24"
                    )}
                >
                    {/* 4. Banners de Status de Assinatura */}
                    <StatusBanners 
                        isExpired={sub.isExpired}
                        isExpiringSoon={sub.isExpiringSoon}
                        daysRemaining={sub.daysRemaining}
                        trial={sub.trial}
                    />

                    {/* 5. Header Visível apenas em Mobile */}
                    <MobileHeader onOpenSidebar={sidebar.toggleSidebar} />

                    {/* 6. Conteúdo da Página */}
                    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden p-6 lg:p-10">
                        {children}
                    </div>
                </main>
            </div>
    );
}
