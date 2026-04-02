'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { QueryErrorState } from '@/components/query-error-state';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRidePaymentStatus } from '@/hooks/use-ride-payment-status';
import { FinanceActionBar } from './_components/finance-action-bar';
import { FinanceAdvancedDetails } from './_components/finance-advanced-details';
import { FinanceFilters } from './_components/finance-filters';
import { FinanceHeader } from './_components/finance-header';
import { FinanceHero } from './_components/finance-hero';
import { FinanceSkeleton } from './_components/finance-skeleton';
import { useExportFinance } from './_hooks/use-export-finance';
import { useExportPdf } from './_hooks/use-export-pdf';
import { useFinanceDashboard } from './_hooks/use-finance-dashboard';

export default function FinancePage() {
  const { user } = useAuth();
  const paymentStatus = useRidePaymentStatus();
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
    filters,
    setFilters,
    clients,
    dashboardParams,
    currentPeriod,
    isClientView,
    selectedClientName,
  } = useFinanceDashboard();
  const financeData = data ?? null;
  const { isExportingPdf, handleExportPDF } = useExportPdf({
    dashboardParams,
    expectedRideCount: financeData?.summary?.count || 0,
    isFinanceDataPending: isPending || isFetching,
    userName: user?.name || 'Motorista',
  });
  const { exportToCSV } = useExportFinance();

  if (isPending && !financeData) {
    return <FinanceSkeleton />;
  }

  if (isError && error && !financeData) {
    return (
      <QueryErrorState
        error={error}
        title="Nao foi possivel carregar o painel financeiro"
        description="A consulta do financeiro falhou. Nenhum resumo foi substituido por valores zerados."
        onRetry={() => {
          void refetch();
        }}
        fullHeight
      />
    );
  }

  return (
    <>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
        data-scroll-lock-root="true"
      >
        <div className="space-y-6 pb-24">
          {isError && error ? (
            <QueryErrorState
              error={error}
              title="Falha ao atualizar o financeiro"
              description="Os dados em cache foram mantidos, mas a ultima atualizacao da API falhou."
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          <header className="flex flex-col gap-5">
            <FinanceHeader
              title="Financeiro"
              subtitle={
                isClientView && selectedClientName
                  ? `Leitura focada em ${selectedClientName}.`
                  : 'Resumo claro dos seus ganhos.'
              }
            />

            <FinanceFilters
              clients={clients || []}
              selectedClientId={filters.clientId || 'all'}
              setSelectedClientId={(id) => setFilters({ clientId: id })}
              selectedPeriod={filters.period}
              setSelectedPeriod={(period) => setFilters({ period })}
              startDate={filters.startDate || ''}
              setStartDate={(date) => setFilters({ startDate: date })}
              endDate={filters.endDate || ''}
              setEndDate={(date) => setFilters({ endDate: date })}
            />
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] xl:items-start">
            <FinanceHero
              summary={financeData?.summary || null}
              byStatus={financeData?.byStatus || []}
              isLoading={isPending}
              currentPeriod={currentPeriod}
              selectedClientName={selectedClientName}
            />

            <FinanceActionBar
              currentPeriod={currentPeriod}
              isLoading={isPending}
              isFetching={isFetching}
              isExportingPdf={isExportingPdf}
              hasData={Boolean(financeData?.summary?.count)}
              onExport={handleExportPDF}
              onExportCSV={() =>
                financeData &&
                exportToCSV(
                  financeData.summary,
                  financeData.recentRides,
                  filters.period,
                  financeData.byStatus,
                )
              }
            />
          </section>

          <section className="rounded-[1.75rem] border border-border-subtle bg-card-background p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-display font-extrabold tracking-tight text-text-primary">
                  {isClientView ? 'Detalhes do cliente' : 'Mais detalhes'}
                </h2>
                <p className="text-sm font-medium text-text-secondary">
                  {isClientView
                    ? 'Abra historico, pagamentos e comportamento sob demanda.'
                    : 'Abra graficos e indicadores avancados quando precisar.'}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvancedDetails((current) => !current)}
                className="h-11 rounded-2xl border-border-subtle bg-background px-5 font-bold text-text-primary"
              >
                {showAdvancedDetails ? (
                  <ChevronUp className="mr-2 size-4" />
                ) : (
                  <ChevronDown className="mr-2 size-4" />
                )}
                {showAdvancedDetails ? 'Ocultar detalhes' : 'Ver mais'}
              </Button>
            </div>
          </section>

          {showAdvancedDetails ? (
            <FinanceAdvancedDetails
              data={financeData}
              isLoading={isPending}
              isClientView={isClientView}
              selectedClientName={selectedClientName}
              currentPeriod={currentPeriod}
              onChangePaymentStatus={paymentStatus.setPaymentStatus}
              isPaymentUpdating={paymentStatus.isUpdatingRide}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
