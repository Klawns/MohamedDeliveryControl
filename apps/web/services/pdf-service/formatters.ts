import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { normalizeDateValue } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import {
  getFinancePaymentStatusFilterLabel,
  type FinancePaymentStatus,
  type FinancePeriod,
} from '@/services/finance-service';
import { type PDFReportRide } from './types';

export function resolveRideDate(ride: PDFReportRide) {
  return (
    normalizeDateValue(ride.rideDate) ??
    normalizeDateValue(ride.createdAt) ??
    new Date()
  );
}

export function formatRideValue(ride: PDFReportRide) {
  const paidWithBalance = ride.paidWithBalance ?? 0;

  if (paidWithBalance <= 0) {
    return formatCurrency(ride.value);
  }

  return `${formatCurrency(ride.value)} (-${formatCurrency(paidWithBalance)})`;
}

export function formatDebtValue(ride: PDFReportRide) {
  const debtValue = ride.debtValue ?? ride.value;
  const paidWithBalance = ride.paidWithBalance ?? 0;

  if (paidWithBalance <= 0) {
    return formatCurrency(debtValue);
  }

  return `${formatCurrency(debtValue)} (Saldo: -${formatCurrency(paidWithBalance)})`;
}

export function calculateRevenueTotals(rides: PDFReportRide[]) {
  const totalValue = rides.reduce((sum, ride) => sum + ride.value, 0);
  const totalPaid = rides
    .filter((ride) => ride.paymentStatus === 'PAID')
    .reduce((sum, ride) => sum + ride.value, 0);
  const totalPending = rides.reduce((sum, ride) => {
    if (ride.paymentStatus !== 'PENDING' || ride.status === 'CANCELLED') {
      return sum;
    }

    return sum + (ride.debtValue ?? ride.value);
  }, 0);

  return {
    totalValue,
    totalPaid,
    totalPending,
  };
}

function formatDateRangeValue(value: string) {
  const date = normalizeDateValue(value);
  return date ? format(date, 'dd/MM/yyyy') : '';
}

export function getPeriodLabel(
  period: FinancePeriod,
  dateRange?: { start: string; end: string },
) {
  if (period === 'custom' && dateRange?.start && dateRange?.end) {
    return `${formatDateRangeValue(dateRange.start)} a ${formatDateRangeValue(dateRange.end)}`;
  }

  switch (period) {
    case 'today':
      return 'Hoje';
    case 'week':
      return 'Esta Semana';
    case 'month':
      return 'Este Mes';
    case 'year':
      return 'Este Ano';
    case 'custom':
      return 'Personalizado';
    default:
      return period;
  }
}

export function getFinancialReportFileName(
  period: FinancePeriod,
  dateRange?: { start: string; end: string },
  paymentStatus?: FinancePaymentStatus,
) {
  const now = new Date();
  const monthName = format(now, 'MMMM', { locale: ptBR });
  const year = format(now, 'yyyy');
  const statusSuffix = paymentStatus
    ? `_${getFinancePaymentStatusFilterLabel(paymentStatus)}`
    : '';

  if (period === 'custom' && dateRange?.start && dateRange?.end) {
    const start = formatDateRangeValue(dateRange.start).replace(/\//g, '_');
    const end = formatDateRangeValue(dateRange.end).replace(/\//g, '_');
    return `Relatorio_Financeiro_${start}_a_${end}${statusSuffix}.pdf`;
  }

  if (period === 'month') {
    return `Relatorio_Financeiro_${monthName.charAt(0).toUpperCase() + monthName.slice(1)}_${year}${statusSuffix}.pdf`;
  }

  return `Relatorio_Financeiro_${getPeriodLabel(period, dateRange)}${statusSuffix}_${format(now, 'dd_MM_yyyy')}.pdf`;
}

export function getClientDebtReportFileName(clientName: string | null | undefined) {
  const safeName = (clientName || 'Sem_nome').replace(/\s+/g, '_');
  return `Debito_${safeName}_${format(new Date(), 'ddMMyyyy')}.pdf`;
}
