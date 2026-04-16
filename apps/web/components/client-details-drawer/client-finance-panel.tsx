'use client';

import type { LucideIcon } from 'lucide-react';
import { Banknote, Bike, DollarSign, Loader2 } from 'lucide-react';
import type { ClientExportController } from '@/app/dashboard/clients/_hooks/use-client-export';
import { ClientExportActions } from '@/components/client-details-drawer/client-export-actions';
import { cn, formatCurrency } from '@/lib/utils';
import { type ClientBalance } from '@/types/rides';

interface ClientFinancePanelProps {
  balance: ClientBalance | null;
  isSettling: boolean;
  onNewRide: () => void;
  onAddPayment: () => void;
  onCloseDebt: () => void;
  clientExport: ClientExportController;
  drawerPortalContainer: HTMLElement | null;
}

interface SummaryMetricProps {
  label: string;
  value: string;
  tone?: 'default' | 'brand' | 'success';
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

function SummaryMetric({
  label,
  value,
  tone = 'default',
}: SummaryMetricProps) {
  const toneClasses = {
    default: 'text-text-primary',
    brand: 'text-icon-brand',
    success: 'text-icon-success',
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-card-background/55 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
        {label}
      </p>
      <p className={cn('mt-2 text-base font-bold tracking-tight', toneClasses[tone])}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = 'ghost',
  isLoading = false,
}: ActionButtonProps) {
  const variantClasses = {
    primary:
      'border-button-primary bg-button-primary text-button-primary-foreground shadow-lg shadow-button-shadow hover:bg-button-primary-hover',
    secondary:
      'border-icon-brand/15 bg-icon-brand/10 text-icon-brand hover:bg-icon-brand/15',
    ghost:
      'border-border-subtle bg-secondary/10 text-text-secondary hover:bg-secondary/15 hover:text-text-primary',
    danger:
      'border-border-destructive/20 bg-button-destructive-subtle text-icon-destructive hover:bg-button-destructive-subtle/80',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
      )}
    >
      {isLoading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <Icon className="size-4 shrink-0" />
      )}
      <span>{label}</span>
    </button>
  );
}

export function ClientFinancePanel({
  balance,
  isSettling,
  onNewRide,
  onAddPayment,
  onCloseDebt,
  clientExport,
  drawerPortalContainer,
}: ClientFinancePanelProps) {
  const remainingBalance = balance ? formatCurrency(balance.remainingBalance) : '---';
  const totalDebt = balance ? formatCurrency(balance.totalDebt) : '---';
  const totalPaid = balance ? formatCurrency(balance.totalPaid) : '---';
  const clientBalance = balance ? formatCurrency(balance.clientBalance) : '---';
  const pendingRides = balance ? String(balance.pendingRides) : '---';
  const hasOpenDebt = !!balance && balance.remainingBalance > 0;

  return (
    <section className="rounded-[2rem] border border-border-subtle bg-background/55 p-5 shadow-sm lg:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-3">
          <div className="rounded-3xl border border-border-subtle bg-card-background/75 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
              Saldo devedor atual
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-destructive">
              {remainingBalance}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryMetric label="Total em corridas" value={totalDebt} />
          <SummaryMetric label="Pago parcial" value={totalPaid} tone="brand" />
          <SummaryMetric label="Credito disponivel" value={clientBalance} tone="success" />
          <SummaryMetric label="Corridas pendentes" value={pendingRides} />
        </div>

        <div className="space-y-3 border-t border-border-subtle pt-5">
          {hasOpenDebt ? (
            <div className="space-y-3 rounded-[1.75rem] border border-border-subtle bg-card-background/55 p-4">
              <div className="grid grid-cols-2 gap-3">
                <ActionButton
                  icon={Banknote}
                  label={isSettling ? 'Quitando...' : 'Quitar divida'}
                  onClick={onCloseDebt}
                  disabled={isSettling}
                  variant="ghost"
                  isLoading={isSettling}
                />
                <ActionButton
                  icon={DollarSign}
                  label="Registrar pagamento"
                  onClick={onAddPayment}
                  variant="secondary"
                />
              </div>
              <ActionButton
                icon={Bike}
                label="Nova corrida"
                onClick={onNewRide}
                variant="primary"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                icon={Bike}
                label="Nova corrida"
                onClick={onNewRide}
                variant="primary"
              />
              <ActionButton
                icon={DollarSign}
                label="Registrar pagamento"
                onClick={onAddPayment}
                variant="secondary"
              />
            </div>
          )}

          <div className="space-y-2 rounded-[1.75rem] border border-border-subtle bg-card-background/55 p-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                Documentos
              </p>
              <p className="text-sm text-text-secondary">
                Exporte corridas por status com periodo personalizado.
              </p>
            </div>

            <ClientExportActions
              controller={clientExport}
              drawerPortalContainer={drawerPortalContainer}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
