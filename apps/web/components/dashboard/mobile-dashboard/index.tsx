"use client";

import { ConfirmModal } from "@/components/confirm-modal";
import { QueryErrorState } from "@/components/query-error-state";
import { RideModal } from "@/components/ride-modal";
import { ClientGrid } from "./components/client-grid";
import { FinanceSummary } from "./components/finance-summary";
import { PDFExport } from "./components/pdf-export";
import { RecentRidesList } from "./components/recent-rides-list";
import { RideForm } from "./components/ride-form";
import { useMobileDashboardController } from "./hooks/use-mobile-dashboard-controller";
import type { MobileDashboardProps } from "./types";
import { FeatureLockShell } from "@/app/dashboard/_components/feature-lock-shell";

export default function MobileDashboard(props: MobileDashboardProps) {
    const dashboard = useMobileDashboardController(props);
    const { trial } = props;

    return (
        <>
            <div className="flex flex-col gap-6 pb-24">
                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Financeiro bloqueado"
                    description="Acompanhe seus resultados novamente assim que ativar um plano pago."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    {dashboard.stats.isError ? (
                        <QueryErrorState
                            error={dashboard.stats.error}
                            title="Nao foi possivel carregar o resumo financeiro"
                            description="As metricas com falha aparecem como indisponiveis, sem zerar silenciosamente os valores."
                            onRetry={() => {
                                void dashboard.stats.refetch();
                            }}
                            className="pb-4"
                        />
                    ) : null}

                    <FinanceSummary
                        today={dashboard.stats.today}
                        week={dashboard.stats.week}
                        month={dashboard.stats.month}
                        isPending={dashboard.stats.isPending}
                    />
                </FeatureLockShell>

                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Clientes bloqueados"
                    description="Sua base continua visivel, mas o gerenciamento fica disponivel somente no plano pago."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    <ClientGrid
                        directory={dashboard.clients.directory}
                        selectedClient={dashboard.clients.selectedClient}
                        onSelect={dashboard.clients.selectClient}
                        creationDialog={dashboard.clients.creationDialog}
                    />
                </FeatureLockShell>

                {dashboard.clients.selectedClient ? (
                    <FeatureLockShell
                        isLocked={trial.shouldLockFeatures}
                        title="Registro bloqueado"
                        description="O formulario continua aparente para reforcar o fluxo, mas o envio depende da assinatura."
                        ctaHref={trial.ctaHref}
                        ctaLabel={trial.ctaLabel}
                    >
                        <RideForm
                            presets={dashboard.rideForm.presets}
                            form={dashboard.rideForm.form}
                            actions={dashboard.rideForm.actions}
                            onDeletePreset={dashboard.rideForm.deletePreset}
                        />
                    </FeatureLockShell>
                ) : null}

                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Historico bloqueado"
                    description="As corridas recentes permanecem visiveis no mobile, mas as interacoes ficam desabilitadas."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    <RecentRidesList
                        rides={dashboard.recentRides.rides}
                        onEdit={dashboard.recentRides.editRide}
                        onDelete={dashboard.recentRides.deleteRide}
                        onChangePaymentStatus={dashboard.recentRides.setPaymentStatus}
                        isPaymentUpdating={dashboard.recentRides.isUpdatingRide}
                        isLoading={dashboard.recentRides.isLoading}
                        hasMore={dashboard.recentRides.hasMore}
                        onLoadMore={dashboard.recentRides.loadMore}
                        error={dashboard.recentRides.error}
                        retry={dashboard.recentRides.retry}
                    />
                </FeatureLockShell>

                <FeatureLockShell
                    isLocked={trial.shouldLockFeatures}
                    title="Exportacao bloqueada"
                    description="Os atalhos de exportacao continuam aparentes, mas exigem assinatura para uso."
                    ctaHref={trial.ctaHref}
                    ctaLabel={trial.ctaLabel}
                >
                    <PDFExport userName={dashboard.user?.name || "Motorista"} />
                </FeatureLockShell>
            </div>

            <RideModal
                isOpen={!!dashboard.dialogs.rideToEdit}
                onClose={dashboard.dialogs.closeRideEditor}
                rideToEdit={dashboard.dialogs.rideToEdit}
                onSuccess={dashboard.dialogs.refreshData}
            />

            <ConfirmModal
                isOpen={!!dashboard.dialogs.rideToDelete}
                onClose={dashboard.dialogs.closeRideDelete}
                onConfirm={dashboard.dialogs.confirmRideDelete}
                title="Excluir Corrida"
                description="Tem certeza que deseja excluir esta corrida? Esta acao nao pode ser desfeita."
                isLoading={dashboard.dialogs.isDeletingRide}
            />
        </>
    );
}
