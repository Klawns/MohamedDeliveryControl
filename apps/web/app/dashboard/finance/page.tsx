'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { QueryErrorState } from '@/components/query-error-state';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRidePaymentStatus } from '@/hooks/use-ride-payment-status';
import { cn } from '@/lib/utils';
import { FinanceActionBar } from './_components/finance-action-bar';
import { FinanceAdvancedDetails } from './_components/finance-advanced-details';
import { FinanceFilters } from './_components/finance-filters';
import { FinanceHeader } from './_components/finance-header';
import { FinanceHero } from './_components/finance-hero';
import { FinanceSkeleton } from './_components/finance-skeleton';
import { useExportFinance } from './_hooks/use-export-finance';
import { useExportPdf } from './_hooks/use-export-pdf';
import { useFinanceDashboard } from './_hooks/use-finance-dashboard';
import { getPeriodAccent } from './_lib/finance-theme';
import type { Period } from './_types';

export default function FinancePage() {
  const { user } = useAuth();
  const paymentStatus = useRidePaymentStatus();
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const {
    data,
    dataUpdatedAt,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
    filters,
    setFilters,
    clientAutocomplete,
    dashboardParams,
    currentPeriod,
    isClientView,
    selectedClientName,
  } = useFinanceDashboard();
  const financeData = data ?? null;
  const isInitialLoading = isPending && !financeData;
  const isTransitioningData =
    Boolean(financeData) && dashboardParams !== null && isFetching;
  const areActionsBlocked = dashboardParams === null;
  const transitionMessage =
    isClientView && selectedClientName
      ? `Atualizando resumo de ${selectedClientName}`
      : `Atualizando resumo ${currentPeriod.label.toLowerCase()}`;
  const { isExportingPdf, handleExportPDF } = useExportPdf({
    dashboardParams,
    expectedRideCount: financeData?.summary?.count || 0,
    isFinanceDataPending: isPending || isFetching,
    userName: user?.name || 'Motorista',
  });
  const { exportToCSV } = useExportFinance();

  if (isInitialLoading) {
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
              clientAutocomplete={clientAutocomplete}
              selectedPeriod={filters.period}
              setSelectedPeriod={(period) => setFilters({ period })}
              startDate={filters.startDate || ''}
              setStartDate={(date) => setFilters({ startDate: date })}
              endDate={filters.endDate || ''}
              setEndDate={(date) => setFilters({ endDate: date })}
            />
          </header>

          <div
            className="relative isolate space-y-6"
            aria-busy={isTransitioningData}
          >
            <AnimatePresence>
              {isTransitioningData && (
                <FinanceRefreshOverlay
                  message={transitionMessage}
                  periodId={currentPeriod.id}
                />
              )}
            </AnimatePresence>

            <motion.section
              key={`finance-summary-${dataUpdatedAt || 'stable'}`}
              initial={{ opacity: 0.9, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] xl:items-start"
            >
              <FinanceHero
                summary={financeData?.summary || null}
                byStatus={financeData?.byStatus || []}
                isLoading={isInitialLoading}
                currentPeriod={currentPeriod}
                selectedClientName={selectedClientName}
              />

              <FinanceActionBar
                currentPeriod={currentPeriod}
                isLoading={isInitialLoading || areActionsBlocked}
                isFetching={isTransitioningData}
                isExportingPdf={isExportingPdf}
                hasData={
                  !areActionsBlocked &&
                  Boolean(financeData?.summary?.count)
                }
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
            </motion.section>

            <motion.div
              initial={false}
              animate={
                isTransitioningData
                  ? { opacity: 0.9 }
                  : { opacity: 1 }
              }
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="space-y-6"
            >
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
                  isLoading={isInitialLoading}
                  isClientView={isClientView}
                  selectedClientName={selectedClientName}
                  currentPeriod={currentPeriod}
                  onChangePaymentStatus={paymentStatus.setPaymentStatus}
                  isPaymentUpdating={paymentStatus.isUpdatingRide}
                />
              ) : null}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

interface FinanceRefreshOverlayProps {
  message: string;
  periodId: Period['id'];
}

function FinanceRefreshOverlay({
  message,
  periodId,
}: FinanceRefreshOverlayProps) {
  const accent = getPeriodAccent(periodId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[2rem]"
    >
      <div className="absolute inset-0 bg-background/28 backdrop-blur-[1.5px]" />

      <motion.div
        animate={{ x: ['-120%', '140%'] }}
        transition={{ duration: 1.15, ease: 'easeInOut', repeat: Infinity }}
        className="absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />

      <div className="absolute inset-x-0 top-5 flex justify-center px-4">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-lg',
            accent.border,
            accent.surface,
            accent.text,
          )}
        >
          <Loader2 className="size-4 animate-spin" />
          <span>{message}</span>
        </div>
      </div>
    </motion.div>
  );
}
