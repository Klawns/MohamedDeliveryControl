import {
  getFinancePaymentStatusFilterLabel,
  type FinancePaymentStatusFilter,
} from '@/services/finance-service';

export function getFinancePaymentStatusSummary(
  paymentStatus: FinancePaymentStatusFilter,
) {
  return `Status: ${getFinancePaymentStatusFilterLabel(paymentStatus)}`;
}

export function getFinancePaymentStatusContextLabel(
  paymentStatus: FinancePaymentStatusFilter,
) {
  switch (paymentStatus) {
    case 'PAID':
      return 'Corridas pagas';
    case 'PENDING':
      return 'Corridas pendentes';
    default:
      return 'Todas as corridas';
  }
}
