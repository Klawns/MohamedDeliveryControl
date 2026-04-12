import { CarFront, Clock3, Target, TrendingUp, Wallet } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type {
  FinanceByStatus,
  FinancePaymentStatusFilter,
  FinanceSummary,
} from '@/services/finance-service';
import { getFinanceStatusTotals } from '../_lib/finance-metrics';
import { getPeriodAccent } from '../_lib/finance-theme';
import type { Period } from '../_types';

interface FinanceKpiGridProps {
  currentPeriod: Period;
  summary: FinanceSummary | null;
  byStatus: FinanceByStatus[];
  paymentStatusFilter: FinancePaymentStatusFilter;
}

export function FinanceKpiGrid({
  currentPeriod,
  summary,
  byStatus,
  paymentStatusFilter,
}: FinanceKpiGridProps) {
  const accent = getPeriodAccent(currentPeriod.id);
  const { paidValue, pendingValue } = getFinanceStatusTotals(byStatus);
  const items =
    paymentStatusFilter === 'all'
      ? [
          {
            label: 'Corridas',
            value: String(summary?.count || 0),
            helper: 'No periodo',
            icon: CarFront,
          },
          {
            label: 'Media',
            value: formatCurrency(summary?.ticketMedio || 0),
            helper: 'Por corrida',
            icon: TrendingUp,
          },
          {
            label: 'Recebido',
            value: formatCurrency(paidValue),
            helper: 'Pago',
            icon: Wallet,
          },
          {
            label: 'Pendente',
            value: formatCurrency(pendingValue),
            helper: 'A receber',
            icon: Clock3,
          },
          {
            label: 'Projecao',
            value: formatCurrency(summary?.projection || 0),
            helper: 'Estimativa',
            icon: Target,
          },
        ]
      : [
          {
            label: 'Corridas',
            value: String(summary?.count || 0),
            helper: 'No periodo',
            icon: CarFront,
          },
          {
            label: 'Media',
            value: formatCurrency(summary?.ticketMedio || 0),
            helper: 'Por corrida',
            icon: TrendingUp,
          },
          paymentStatusFilter === 'PAID'
            ? {
                label: 'Recebido',
                value: formatCurrency(paidValue),
                helper: 'Corridas pagas',
                icon: Wallet,
              }
            : {
                label: 'Pendente',
                value: formatCurrency(pendingValue),
                helper: 'Em aberto',
                icon: Clock3,
              },
          {
            label: 'Projecao',
            value: formatCurrency(summary?.projection || 0),
            helper: 'Estimativa',
            icon: Target,
          },
        ];

  return (
    <section
      className={cn(
        'grid gap-4 sm:grid-cols-2',
        paymentStatusFilter === 'all' ? 'xl:grid-cols-5' : 'xl:grid-cols-4',
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.label}
            className="rounded-[1.5rem] border border-border-subtle bg-card-background p-4 shadow-sm md:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-display font-extrabold tracking-tight text-text-primary">
                  {item.value}
                </p>
              </div>

              <div
                className={cn(
                  'rounded-2xl p-3',
                  accent.surface,
                  accent.text,
                )}
              >
                <Icon className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{item.helper}</p>
          </article>
        );
      })}
    </section>
  );
}
