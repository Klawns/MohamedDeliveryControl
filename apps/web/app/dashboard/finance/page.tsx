'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
import { buildFinanceFilterChips } from './_lib/finance-filter-chips';
import { financeMotion } from './_lib/finance-motion';
import { getPeriodAccent } from './_lib/finance-theme';
import type { Period } from './_types';

export default function FinancePage() {
  const shouldReduceMotion = useReducedMotion();
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
  const contentMotion = shouldReduceMotion
    ? { duration: 0 }
    : financeMotion.content;
  const activeFilterChips = buildFinanceFilterChips({
    period: filters.period,
    periodLabel: currentPeriod.label,
    paymentStatus: filters.paymentStatus,
    selectedClientName,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
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
              selectedPaymentStatus={filters.paymentStatus}
              setSelectedPaymentStatus={(paymentStatus) =>
                setFilters({ paymentStatus })
              }
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
              initial={false}
              animate={
                isTransitioningData
                  ? { opacity: 0.84, y: 4 }
                  : { opacity: 1, y: 0 }
              }
              transition={contentMotion}
              className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] xl:items-start"
            >
              <motion.div
                initial={false}
                animate={
                  isTransitioningData
                    ? { opacity: 0.76, y: 4, filter: 'blur(1.25px)' }
                    : { opacity: 1, y: 0, filter: 'blur(0px)' }
                }
                transition={contentMotion}
              >
                <FinanceHero
                  summary={financeData?.summary || null}
                  byStatus={financeData?.byStatus || []}
                  isLoading={isInitialLoading}
                  currentPeriod={currentPeriod}
                  paymentStatusFilter={filters.paymentStatus}
                  selectedClientName={selectedClientName}
                />
              </motion.div>

              <motion.div
                initial={false}
                animate={
                  isTransitioningData
                    ? { opacity: 0.8, y: 3, filter: 'blur(1px)' }
                    : { opacity: 1, y: 0, filter: 'blur(0px)' }
                }
                transition={{
                  ...contentMotion,
                  delay: shouldReduceMotion ? 0 : 0.03,
                }}
              >
                <FinanceActionBar
                  currentPeriod={currentPeriod}
                  activeFilterChips={activeFilterChips}
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
                      filters.paymentStatus,
                    )
                  }
                />
              </motion.div>
            </motion.section>

            <motion.div
              initial={false}
              animate={
                isTransitioningData
                  ? { opacity: 0.88, y: 2 }
                  : { opacity: 1, y: 0 }
              }
              transition={contentMotion}
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
                  paymentStatusFilter={filters.paymentStatus}
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
  const shouldReduceMotion = useReducedMotion();
  const accent = getPeriodAccent(periodId);
  const overlayTransition = shouldReduceMotion
    ? { duration: 0 }
    : financeMotion.overlay;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={overlayTransition}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[2rem]"
    >
      <div className="absolute inset-0 bg-background/12" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/38 to-transparent" />
      <div
        className={cn(
          'absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
          accent.heroLine,
        )}
      />

      <div className="absolute inset-x-0 top-5 flex justify-center px-4">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border bg-background/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary shadow-sm backdrop-blur-md',
            accent.border,
          )}
        >
          <Loader2 className={cn('size-3.5 animate-spin', accent.text)} />
          <span>{message}</span>
        </div>
      </div>
    </motion.div>
  );
}
