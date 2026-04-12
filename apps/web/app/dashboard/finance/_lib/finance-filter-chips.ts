import { formatDateValue } from '@/lib/date-utils';
import { getFinancePaymentStatusFilterLabel } from '@/services/finance-service';
import type {
  FinancePaymentStatusFilter,
} from '@/services/finance-service';
import type { PeriodId } from '../_types';

export interface FinanceFilterChip {
  id: string;
  label: string;
}

interface BuildFinanceFilterChipsParams {
  period: PeriodId;
  periodLabel: string;
  paymentStatus: FinancePaymentStatusFilter;
  selectedClientName?: string | null;
  startDate?: string;
  endDate?: string;
}

function getPeriodChipLabel({
  period,
  periodLabel,
  startDate,
  endDate,
}: Pick<
  BuildFinanceFilterChipsParams,
  'period' | 'periodLabel' | 'startDate' | 'endDate'
>) {
  if (period !== 'custom') {
    return periodLabel;
  }

  if (startDate && endDate) {
    return `${formatDateValue(startDate, 'dd/MM')} - ${formatDateValue(endDate, 'dd/MM')}`;
  }

  if (startDate) {
    return `Desde ${formatDateValue(startDate, 'dd/MM')}`;
  }

  if (endDate) {
    return `Ate ${formatDateValue(endDate, 'dd/MM')}`;
  }

  return periodLabel;
}

export function buildFinanceFilterChips({
  period,
  periodLabel,
  paymentStatus,
  selectedClientName,
  startDate,
  endDate,
}: BuildFinanceFilterChipsParams): FinanceFilterChip[] {
  const chips: FinanceFilterChip[] = [
    {
      id: 'period',
      label: getPeriodChipLabel({
        period,
        periodLabel,
        startDate,
        endDate,
      }),
    },
  ];

  if (paymentStatus !== 'all') {
    chips.push({
      id: 'status',
      label: getFinancePaymentStatusFilterLabel(paymentStatus),
    });
  }

  if (selectedClientName) {
    chips.push({
      id: 'client',
      label: selectedClientName,
    });
  }

  return chips;
}
