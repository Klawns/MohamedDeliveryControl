import { cn, formatCurrency } from '@/lib/utils';
import type {
  FinanceByStatus,
  FinanceSummary,
  FinancePaymentStatusFilter,
} from '@/services/finance-service';
import { getFinancePaymentStatusFilterLabel } from '@/services/finance-service';
import { getFinanceStatusTotals } from '../_lib/finance-metrics';
import {
  getFinancePaymentStatusContextLabel,
} from '../_lib/finance-payment-status';
import { getPeriodAccent } from '../_lib/finance-theme';
import type { Period } from '../_types';

interface FinanceHeroProps {
  currentPeriod: Period;
  summary: FinanceSummary | null;
  byStatus: FinanceByStatus[];
  isLoading: boolean;
  paymentStatusFilter: FinancePaymentStatusFilter;
  selectedClientName?: string | null;
}

export function FinanceHero({
  currentPeriod,
  summary,
  byStatus,
  isLoading,
  paymentStatusFilter,
  selectedClientName,
}: FinanceHeroProps) {
  const accent = getPeriodAccent(currentPeriod.id);
  const { paidValue, pendingValue } = getFinanceStatusTotals(byStatus);
  const isClientView = Boolean(selectedClientName);
  const isEmptyState = (summary?.count || 0) === 0 && (summary?.totalValue || 0) === 0;
  const summaryItems = [
    {
      label: 'Corridas',
      value: String(summary?.count || 0),
      helper: 'No periodo',
    },
    {
      label: 'Media',
      value: formatCurrency(summary?.ticketMedio || 0),
      helper: 'Por corrida',
    },
    paymentStatusFilter === 'PAID'
      ? {
          label: 'Recebido',
          value: formatCurrency(paidValue),
          helper: 'Corridas pagas',
        }
      : paymentStatusFilter === 'PENDING'
        ? {
            label: 'Pendente',
            value: formatCurrency(pendingValue),
            helper: 'Em aberto',
          }
        : {
            label: 'Pendente',
            value: formatCurrency(pendingValue),
            helper: 'A receber',
          },
  ];
  const statusContextLabel = getFinancePaymentStatusContextLabel(
    paymentStatusFilter,
  );
  const totalValue = formatCurrency(summary?.totalValue || 0);
  const heroChips = [
    {
      id: 'period',
      label: currentPeriod.label,
      className: cn('border', accent.heroChip),
    },
    selectedClientName
      ? {
          id: 'client',
          label: selectedClientName,
          className:
            'border border-border-subtle bg-background/80 text-text-primary',
        }
      : null,
    paymentStatusFilter !== 'all'
      ? {
          id: 'status',
          label: getFinancePaymentStatusFilterLabel(paymentStatusFilter),
          className:
            'border border-border-subtle bg-background/80 text-text-secondary',
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    className: string;
  }>;
  const subtitle = paymentStatusFilter === 'all'
    ? isClientView
      ? 'Total do cliente no periodo selecionado'
      : 'Total no periodo selecionado'
    : `${statusContextLabel} no periodo selecionado`;
  const emptyStateCopy = 'Ajuste periodo, status ou cliente para visualizar movimentacoes.';

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm md:rounded-[2.5rem] md:p-8',
        accent.heroBorder,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0))]" />
      <div
        className={cn(
          'pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
          accent.heroLine,
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute right-[-8%] top-[-18%] size-36 rounded-full blur-3xl',
          accent.heroGlow,
        )}
      />

      <div className="relative flex h-full flex-col gap-6">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              Total das corridas
            </p>
            <h2
              className={cn(
                'font-display text-5xl font-extrabold tracking-[-0.04em] text-slate-950 md:text-6xl',
                isLoading && 'opacity-40 blur-[1px]',
              )}
            >
              {totalValue}
            </h2>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">
                {subtitle}
              </p>
              {isEmptyState ? (
                <p className="max-w-[34ch] text-sm text-text-muted">
                  {emptyStateCopy}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {heroChips.map((chip) => (
              <span
                key={chip.id}
                className={cn(
                  'inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-xs font-medium',
                  chip.className,
                )}
              >
                <span className="truncate">{chip.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200/80 pt-5 sm:grid-cols-3">
          {summaryItems.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'space-y-1 sm:pl-4',
                index === 0 && 'sm:pl-0',
                index > 0 && 'sm:border-l sm:border-slate-200/80',
                isEmptyState && 'opacity-75',
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                {item.label}
              </p>
              <p className="text-xl font-display font-extrabold text-slate-950 md:text-2xl">
                {item.value}
              </p>
              <p className="text-sm text-text-secondary">{item.helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
