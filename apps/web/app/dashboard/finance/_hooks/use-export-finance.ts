'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx-js-style';
import { formatDateValue } from '@/lib/date-utils';
import {
  getFinancePaymentStatusFilterLabel,
  type FinanceByStatus,
  type FinancePaymentStatusFilter,
  type FinanceSummary,
  type RecentRide,
} from '@/services/finance-service';
import type { PeriodId } from '../_types';

export function useExportFinance() {
  const exportToCSV = (
    stats: FinanceSummary,
    rides: RecentRide[],
    period: PeriodId,
    byStatus: FinanceByStatus[],
    paymentStatus: FinancePaymentStatusFilter,
  ) => {
    if (!stats || !rides.length) return;

    const totalPaid = byStatus.find((status) => status.status === 'PAID')?.value || 0;
    const totalPending =
      byStatus.find((status) => status.status === 'PENDING')?.value || 0;

    const headerStyle = {
      fill: { fgColor: { rgb: '3B82F6' } },
      font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 12 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
      },
    };

    const sectionHeaderStyle = {
      font: { bold: true, sz: 13 },
      fill: { fgColor: { rgb: 'F1F5F9' } },
      alignment: { horizontal: 'left' },
    };

    const labelStyle = {
      font: { bold: true },
      alignment: { horizontal: 'left' },
    };
    const currencyStyle = { numFmt: '"R$ "#,##0.00' };

    const wb = XLSX.utils.book_new();

    const periodLabels: Record<string, string> = {
      today: 'HOJE',
      week: 'SEMANA',
      month: 'MES',
      year: 'ANO',
      custom: 'PERSONALIZADO',
    };

    const brandStyle = {
      font: { bold: true, sz: 16, color: { rgb: '1E293B' } },
    };
    const subtitleStyle = {
      font: { sz: 10, color: { rgb: '64748B' } },
    };

    const summaryData = [
      [
        {
          v: 'RELATORIO FINANCEIRO',
          s: {
            ...sectionHeaderStyle,
            font: { ...sectionHeaderStyle.font, sz: 14 },
          },
        },
        '',
        '',
        '',
        {
          v: 'ROTTA',
          s: { ...brandStyle, alignment: { horizontal: 'right' } },
        },
      ],
      [
        '',
        '',
        '',
        '',
        {
          v: 'Gestao de Entregas',
          s: { ...subtitleStyle, alignment: { horizontal: 'right' } },
        },
      ],
      [],
      [{ v: 'RESUMO DO PERIODO', s: sectionHeaderStyle }, { v: '', s: sectionHeaderStyle }],
      [{ v: 'Periodo', s: labelStyle }, { v: periodLabels[period] || period.toUpperCase() }],
      [{ v: 'Status', s: labelStyle }, { v: getFinancePaymentStatusFilterLabel(paymentStatus) }],
      [{ v: 'Total de Corridas', s: labelStyle }, { v: stats.count }],
      [{ v: 'Total Bruto', s: labelStyle }, { v: stats.totalValue, t: 'n', s: currencyStyle }],
      [{ v: 'Total Pago', s: labelStyle }, { v: totalPaid, t: 'n', s: currencyStyle }],
      [{ v: 'Total Pendente', s: labelStyle }, { v: totalPending, t: 'n', s: currencyStyle }],
      [{ v: 'Media por Corrida', s: labelStyle }, { v: stats.ticketMedio, t: 'n', s: currencyStyle }],
      [{ v: 'Projecao Mensal', s: labelStyle }, { v: stats.projection, t: 'n', s: currencyStyle }],
      [],
      [
        { v: 'DETALHAMENTO DAS CORRIDAS', s: sectionHeaderStyle },
        { v: '', s: sectionHeaderStyle },
        { v: '', s: sectionHeaderStyle },
        { v: '', s: sectionHeaderStyle },
        { v: '', s: sectionHeaderStyle },
      ],
      [
        { v: 'Data', s: headerStyle },
        { v: 'Cliente', s: headerStyle },
        { v: 'Local', s: headerStyle },
        { v: 'Valor', s: headerStyle },
        { v: 'Status', s: headerStyle },
      ],
    ];

    const rideRows = rides.map((ride) => [
      { v: formatDateValue(ride.rideDate, 'dd/MM/yy HH:mm') },
      { v: ride.clientName || 'Cliente' },
      { v: ride.location || '---' },
      { v: ride.value, t: 'n', s: currencyStyle },
      {
        v: ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente',
        s: {
          font: {
            color: {
              rgb: ride.paymentStatus === 'PAID' ? '10B981' : 'F59E0B',
            },
            bold: true,
          },
        },
      },
    ]);

    const finalData = [...summaryData, ...rideRows];
    const ws = XLSX.utils.aoa_to_sheet(finalData);

    ws['!cols'] = [
      { wch: 18 },
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');

    const monthName = format(new Date(), 'MMMM', { locale: ptBR });
    const year = format(new Date(), 'yyyy');
    const statusLabel = getFinancePaymentStatusFilterLabel(paymentStatus).replace(
      /\s+/g,
      '_',
    );
    const fileName =
      period === 'month'
        ? `Planilha_Financeira_${monthName.charAt(0).toUpperCase() + monthName.slice(1)}_${year}_${statusLabel}.xlsx`
        : `Planilha_Financeira_${periodLabels[period] || period.toUpperCase()}_${statusLabel}_${format(new Date(), 'dd_MM_yyyy')}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return {
    exportToCSV,
  };
}
