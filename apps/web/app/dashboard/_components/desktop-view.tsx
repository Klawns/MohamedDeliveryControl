"use client";

import { type User } from "@/hooks/use-auth";
import { RidesChart } from "@/components/dashboard/rides-chart";
import {
    type DashboardDesktopStats,
    type DashboardRideActions,
} from "../_hooks/use-dashboard";
import { DashboardHeader } from "./dashboard-header";
import { DashboardStatsGrid } from "./dashboard-stats-grid";
import { RecentActivities } from "./recent-activities";
import { QuickActions } from "./quick-actions";
import { FinanceCard } from "./finance-card";
import { FeatureLockShell } from "./feature-lock-shell";
import { TrialStatusCard } from "./trial-status-card";
import type { FreeTrialState } from "@/services/free-trial-service";

interface DashboardDesktopViewProps {
    user: User | null;
    stats: DashboardDesktopStats;
    rides: DashboardRideActions;
    trial: FreeTrialState;
}

export function DashboardDesktopView({
    user,
    stats,
    rides,
    trial,
}: DashboardDesktopViewProps) {
    return (
        <div className="space-y-8">
            <DashboardHeader
                userName={user?.name || ""}
                period={stats.period}
                setPeriod={stats.setPeriod}
                isLocked={trial.shouldLockFeatures}
            />

            <TrialStatusCard trial={trial} />

            <FeatureLockShell
                isLocked={trial.shouldLockFeatures}
                title="Resumo bloqueado"
                description="Assine para voltar a registrar corridas, consultar relatorios e usar os atalhos principais."
                ctaHref={trial.ctaHref}
                ctaLabel={trial.ctaLabel}
            >
                <DashboardStatsGrid
                    count={stats.count}
                    totalValue={stats.totalValue}
                    period={stats.period}
                    isLoading={stats.isPending}
                />
            </FeatureLockShell>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch min-h-0">
                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Atividades bloqueadas"
                    description="Suas corridas continuam visiveis no dashboard, mas novas interacoes dependem da assinatura."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    <RecentActivities
                        key={`activities-${stats.period}`}
                        period={stats.period}
                        onEditRide={rides.editRide}
                        onDeleteRide={rides.requestRideDelete}
                    />
                </FeatureLockShell>

                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Graficos bloqueados"
                    description="Desbloqueie o plano pago para analisar a evolucao completa da sua operacao."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    <RidesChart
                        key={`chart-${stats.period}`}
                        rides={stats.monthRides || []}
                        className="h-full"
                    />
                </FeatureLockShell>

                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Acoes rapidas bloqueadas"
                    description="Cadastros e registros continuam visiveis, mas exigem assinatura para voltar a operar."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    <QuickActions />
                </FeatureLockShell>

                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Financeiro bloqueado"
                    description="Os modulos financeiros permanecem aparentes para reforcar o valor do produto, mas estao bloqueados."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    <FinanceCard />
                </FeatureLockShell>
            </div>
        </div>
    );
}
