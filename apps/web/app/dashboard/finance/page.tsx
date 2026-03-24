"use client";

import { useFinanceDashboard } from "./_hooks/use-finance-dashboard";
import { useExportPdf } from "./_hooks/use-export-pdf";
import { useExportFinance } from "./_hooks/use-export-finance";
import { FinanceHeader } from "./_components/finance-header";
import { FinanceFilters } from "./_components/finance-filters";
import { StatsCard } from "./_components/stats-card";
import { ExportDialog } from "./_components/export-dialog";
import { RevenueTrendChart, ClientDistributionChart } from "./_components/finance-charts";
import { RecentActivity } from "./_components/recent-activity";
import { FinanceSkeleton } from "./_components/finance-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { PERIODS, Period } from "./_types";

export default function FinancePage() {
    const { user } = useAuth();
    const {
        data,
        isLoading,
        filters,
        setFilters,
        clients,
        currentPeriod,
    } = useFinanceDashboard();

    const {
        isPixModalOpen,
        setIsPixModalOpen,
        pixKey,
        setPixKey,
        handleExportPDF,
        confirmExport,
    } = useExportPdf({
        viewStats: data?.summary || null,
        rides: data?.recentRides || [],
        selectedPeriod: filters.period,
        userName: user?.name || "Motorista",
    });

    const { exportToCSV } = useExportFinance();

    if (isLoading && !data) {
        return <FinanceSkeleton />;
    }

    return (
        <div className="space-y-8 pb-24">
            <header className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <FinanceHeader
                        title="Financeiro"
                        subtitle="Analytics completo dos seus rendimentos e performance."
                    />
                </div>

                <FinanceFilters
                    clients={clients || []}
                    selectedClientId={filters.clientId || "all"}
                    setSelectedClientId={(id) => setFilters({ clientId: id })}
                    selectedPeriod={filters.period}
                    setSelectedPeriod={(period) => setFilters({ period })}
                    startDate={filters.startDate || ""}
                    setStartDate={(date) => setFilters({ startDate: date })}
                    endDate={filters.endDate || ""}
                    setEndDate={(date) => setFilters({ endDate: date })}
                />
            </header>

            <StatsCard
                viewStats={data?.summary || null}
                isLoading={isLoading}
                currentPeriod={currentPeriod}
                onExport={handleExportPDF}
                onExportCSV={() => data && exportToCSV(data.summary, data.recentRides, filters.period, data.byStatus)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueTrendChart 
                    data={data?.trends || []} 
                    isLoading={isLoading} 
                    color={PERIODS.find(p => p.id === filters.period)?.chartColor || 'var(--color-primary)'}
                />
                <ClientDistributionChart 
                    data={data?.byClient || []} 
                    isLoading={isLoading} 
                />
            </div>

            <section className="bg-card-background p-8 rounded-[3rem] border border-border-subtle backdrop-blur-xl shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-display font-extrabold text-text-primary tracking-tight">Atividade Recente</h2>
                        <p className="text-sm text-text-secondary font-medium">Últimas 10 corridas registradas</p>
                    </div>
                </div>
                <RecentActivity 
                    rides={data?.recentRides || []} 
                    isLoading={isLoading} 
                />
            </section>

            <ExportDialog
                isOpen={isPixModalOpen}
                onOpenChange={setIsPixModalOpen}
                pixKey={pixKey}
                setPixKey={setPixKey}
                onConfirm={confirmExport}
            />
        </div>
    );
}
