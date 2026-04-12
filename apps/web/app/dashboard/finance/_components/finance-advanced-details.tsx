'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  FinanceDashboardData,
  FinancePaymentStatusFilter,
} from '@/services/finance-service';
import { PERIODS, type FinanceDashboardTab, type Period } from '../_types';
import { ClientHighlightsCard } from './client-highlights-card';
import { ClientDistributionChart, RevenueTrendChart } from './finance-charts';
import { FinanceKpiGrid } from './finance-kpi-grid';
import { PaymentStatusBarChart } from './payment-status-bar-chart';
import { PaymentSummaryCard } from './payment-summary-card';
import { RecentActivity } from './recent-activity';
import { SelectedClientSummaryCard } from './selected-client-summary-card';

interface FinanceAdvancedDetailsProps {
  data: FinanceDashboardData | null;
  isLoading: boolean;
  isClientView: boolean;
  selectedClientName: string | null;
  currentPeriod: Period;
  paymentStatusFilter: FinancePaymentStatusFilter;
  onChangePaymentStatus: (
    ride: FinanceDashboardData['recentRides'][number],
    status: 'PAID' | 'PENDING',
  ) => void | Promise<unknown>;
  isPaymentUpdating: (rideId: string) => boolean;
}

export function FinanceAdvancedDetails({
  data,
  isLoading,
  isClientView,
  selectedClientName,
  currentPeriod,
  paymentStatusFilter,
  onChangePaymentStatus,
  isPaymentUpdating,
}: FinanceAdvancedDetailsProps) {
  const [activeTab, setActiveTab] =
    useState<FinanceDashboardTab>('overview');
  const resolvedActiveTab: FinanceDashboardTab = isClientView
    ? activeTab === 'clients' || activeTab === 'rides'
      ? 'overview'
      : activeTab
    : activeTab === 'history'
      ? 'overview'
      : activeTab;

  const chartColor =
    PERIODS.find((period) => period.id === currentPeriod.id)?.chartColor ||
    'var(--color-primary)';

  return (
    <Tabs
      value={resolvedActiveTab}
      onValueChange={(value) => setActiveTab(value as FinanceDashboardTab)}
      className="space-y-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-display font-extrabold tracking-tight text-text-primary md:text-2xl">
            {isClientView ? 'Perfil financeiro' : 'Detalhes'}
          </h2>
          <p className="text-sm font-medium text-text-secondary">
            {isClientView
              ? 'Historico e cobranca de um unico cliente.'
              : 'Graficos e listas por contexto.'}
          </p>
        </div>

        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl bg-muted/60 p-1 no-scrollbar md:w-auto">
          <TabsTrigger
            className="rounded-xl px-4 py-2 whitespace-nowrap"
            value="overview"
          >
            Resumo
          </TabsTrigger>
          {isClientView ? (
            <TabsTrigger
              className="rounded-xl px-4 py-2 whitespace-nowrap"
              value="history"
            >
              Historico
            </TabsTrigger>
          ) : (
            <TabsTrigger
              className="rounded-xl px-4 py-2 whitespace-nowrap"
              value="clients"
            >
              Clientes
            </TabsTrigger>
          )}
          <TabsTrigger
            className="rounded-xl px-4 py-2 whitespace-nowrap"
            value="payments"
          >
            Pagamentos
          </TabsTrigger>
          {!isClientView ? (
            <TabsTrigger
              className="rounded-xl px-4 py-2 whitespace-nowrap"
              value="rides"
            >
              Corridas
            </TabsTrigger>
          ) : null}
        </TabsList>
      </div>

      {isClientView ? (
        <>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
              <RevenueTrendChart
                data={data?.trends || []}
                isLoading={isLoading}
                color={chartColor}
              />
              <SelectedClientSummaryCard
                clientName={selectedClientName || 'Cliente'}
                rides={data?.recentRides || []}
                onChangePaymentStatus={onChangePaymentStatus}
                isPaymentUpdating={isPaymentUpdating}
              />
            </div>

            <section className="rounded-[1.75rem] border border-border-subtle bg-card-background px-5 shadow-sm md:px-6">
              <Accordion
                type="single"
                collapsible
                defaultValue="recent-activity"
              >
                <AccordionItem value="recent-activity" className="border-none">
                  <AccordionTrigger className="py-5 hover:no-underline">
                    <div>
                      <h3 className="text-left text-lg font-display font-extrabold text-text-primary">
                        Ultimas movimentacoes
                      </h3>
                      <p className="mt-1 text-left text-sm font-medium text-text-secondary">
                        Historico recente de {selectedClientName || 'cliente'}.
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <RecentActivity
                      rides={data?.recentRides?.slice(0, 5) || []}
                      isLoading={isLoading}
                      onChangePaymentStatus={onChangePaymentStatus}
                      isPaymentUpdating={isPaymentUpdating}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <section className="rounded-[2rem] border border-border-subtle bg-card-background p-5 shadow-sm backdrop-blur-xl md:rounded-[3rem] md:p-8">
              <div className="mb-6 md:mb-8">
                <h2 className="text-xl font-display font-extrabold tracking-tight text-text-primary md:text-2xl">
                  Historico completo
                </h2>
                <p className="text-sm font-medium text-text-secondary">
                  Ultimas corridas do cliente no periodo filtrado.
                </p>
              </div>
              <RecentActivity
                rides={data?.recentRides || []}
                isLoading={isLoading}
                onChangePaymentStatus={onChangePaymentStatus}
                isPaymentUpdating={isPaymentUpdating}
              />
            </section>
          </TabsContent>
        </>
      ) : (
        <>
          <FinanceKpiGrid
            summary={data?.summary || null}
            currentPeriod={currentPeriod}
            byStatus={data?.byStatus || []}
            paymentStatusFilter={paymentStatusFilter}
          />

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
              <RevenueTrendChart
                data={data?.trends || []}
                isLoading={isLoading}
                color={chartColor}
              />
              <PaymentSummaryCard
                data={data?.byStatus || []}
                paymentStatusFilter={paymentStatusFilter}
                rideCount={data?.summary?.count || 0}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
              <PaymentStatusBarChart
                data={data?.byStatus || []}
                isLoading={isLoading}
                paymentStatusFilter={paymentStatusFilter}
              />
              <ClientHighlightsCard data={data?.byClient || []} />
            </div>

            <section className="rounded-[1.75rem] border border-border-subtle bg-card-background px-5 shadow-sm md:px-6">
              <Accordion
                type="single"
                collapsible
                defaultValue="recent-activity"
              >
                <AccordionItem value="recent-activity" className="border-none">
                  <AccordionTrigger className="py-5 hover:no-underline">
                    <div>
                      <h3 className="text-left text-lg font-display font-extrabold text-text-primary">
                        Atividade recente
                      </h3>
                      <p className="mt-1 text-left text-sm font-medium text-text-secondary">
                        Ultimas corridas do periodo.
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <RecentActivity
                      rides={data?.recentRides?.slice(0, 5) || []}
                      isLoading={isLoading}
                      onChangePaymentStatus={onChangePaymentStatus}
                      isPaymentUpdating={isPaymentUpdating}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
              <ClientDistributionChart
                data={data?.byClient || []}
                isLoading={isLoading}
              />
              <ClientHighlightsCard data={data?.byClient || []} />
            </div>
          </TabsContent>
        </>
      )}

      <TabsContent value="payments" className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
          <PaymentStatusBarChart
            data={data?.byStatus || []}
            isLoading={isLoading}
            paymentStatusFilter={paymentStatusFilter}
          />
          <PaymentSummaryCard
            data={data?.byStatus || []}
            paymentStatusFilter={paymentStatusFilter}
            rideCount={data?.summary?.count || 0}
          />
        </div>
      </TabsContent>

      {!isClientView ? (
        <TabsContent value="rides" className="space-y-6">
          <section className="rounded-[2rem] border border-border-subtle bg-card-background p-5 shadow-sm backdrop-blur-xl md:rounded-[3rem] md:p-8">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl font-display font-extrabold tracking-tight text-text-primary md:text-2xl">
                Atividade recente
              </h2>
              <p className="text-sm font-medium text-text-secondary">
                Ultimas 10 corridas
              </p>
            </div>
            <RecentActivity
              rides={data?.recentRides || []}
              isLoading={isLoading}
              onChangePaymentStatus={onChangePaymentStatus}
              isPaymentUpdating={isPaymentUpdating}
            />
          </section>
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
