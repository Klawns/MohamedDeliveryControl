"use client";

import { User } from "@/hooks/use-auth";
import { MobileDashboard } from "@/components/dashboard/mobile-dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCurrency } from "@/lib/format";
import { Ride } from "@/types/rides";

interface DashboardMobileViewProps {
    user: User | null;
    period: string;
    stats: {
        count: number;
        totalValue: number;
        rides: Ride[];
    };
    onRideCreated: () => void;
}

/**
 * Visão otimizada para dispositivos móveis da página de Dashboard.
 */
export function DashboardMobileView({ user, period, stats, onRideCreated }: DashboardMobileViewProps) {
    return (
        <div className="space-y-6">
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-display font-extrabold text-foreground tracking-tight">Controle de Corrida</h1>
                    <p className="text-muted-foreground text-sm">Olá, {user?.name?.split(" ")[0]}! Registre suas corridas aqui.</p>
                </div>
                <ThemeToggle />
            </header>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card-background border border-border-subtle p-4 rounded-2xl shadow-sm">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase">Corridas {period === 'today' ? 'Hoje' : 'na Semana'}</p>
                    <h3 className="text-lg font-bold text-text-primary mt-1">{stats.count}</h3>
                </div>
                <div className="bg-card-background border border-border-subtle p-4 rounded-2xl shadow-sm">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase">Faturamento</p>
                    <h3 className="text-lg font-bold text-text-primary mt-1">
                        {formatCurrency(stats.totalValue)}
                    </h3>
                </div>
            </div>

            <MobileDashboard onRideCreated={onRideCreated} />
        </div>
    );
}
