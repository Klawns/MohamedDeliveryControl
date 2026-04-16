"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { DashboardHomeMobileHeader } from "./dashboard-home-mobile-header";

interface MobileHeaderProps {
    onOpenNavigationMenu: () => void;
    isNavigationMenuOpen: boolean;
    userName?: string | null;
}

function getDashboardMobileHeaderTitle(pathname: string) {
    if (pathname === "/dashboard") {
        return "Controle de Corrida";
    }

    if (pathname.startsWith("/dashboard/clients")) {
        return "Meus Clientes";
    }

    if (pathname.startsWith("/dashboard/rides")) {
        return "Historico de Corridas";
    }

    if (pathname.startsWith("/dashboard/finance")) {
        return "Financeiro";
    }

    if (pathname.startsWith("/dashboard/settings")) {
        return "Configuracoes";
    }

    return null;
}

function getDashboardMobileHeaderGreeting(pathname: string) {
    if (pathname === "/dashboard") {
        return "default";
    }

    return null;
}

export function MobileHeader({
    onOpenNavigationMenu,
    isNavigationMenuOpen,
    userName,
}: MobileHeaderProps) {
    const pathname = usePathname();
    const title = getDashboardMobileHeaderTitle(pathname);
    const greeting = getDashboardMobileHeaderGreeting(pathname);

    if (title) {
        return (
            <DashboardHomeMobileHeader
                onOpenNavigationMenu={onOpenNavigationMenu}
                isNavigationMenuOpen={isNavigationMenuOpen}
                userName={userName}
                title={title}
                greeting={greeting}
            />
        );
    }

    return (
        <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card/40 p-6 backdrop-blur-md lg:hidden">
            <Link
                href="/dashboard"
                aria-label="Ir para o Dashboard"
                className="flex items-center gap-3 active:scale-95 transition-transform"
            >
                <div className="relative w-8 h-8">
                    <Image
                        src="/assets/logo8.jpg"
                        alt="Rotta Logo"
                        fill
                        className="object-cover rounded-lg"
                    />
                </div>
                <span className="font-bold tracking-tight uppercase italic text-foreground">ROTTA</span>
            </Link>
            <button
                onClick={onOpenNavigationMenu}
                aria-expanded={isNavigationMenuOpen}
                aria-label={isNavigationMenuOpen ? "Fechar menu" : "Abrir menu"}
                className="p-2 bg-accent/50 rounded-lg text-muted-foreground active:scale-95 transition-transform"
            >
                <Menu size={20} />
            </button>
        </header>
    );
}
