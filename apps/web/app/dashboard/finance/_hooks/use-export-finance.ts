"use client";

import { FinanceStats, PeriodId, RecentRide, FinanceByStatus } from "../_types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";

export function useExportFinance() {
  const exportToCSV = (stats: FinanceStats, rides: RecentRide[], period: PeriodId, byStatus: FinanceByStatus[]) => {
    if (!stats || !rides.length) return;

    const totalPaid = byStatus.find(s => s.status === 'PAID')?.value || 0;
    const totalPending = byStatus.find(s => s.status === 'PENDING')?.value || 0;

    // --- Estilos ---
    const headerStyle = {
      fill: { fgColor: { rgb: "3B82F6" } }, // Blue-500
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const sectionHeaderStyle = {
      font: { bold: true, sz: 13 },
      fill: { fgColor: { rgb: "F1F5F9" } }, // Slate-100
      alignment: { horizontal: "left" }
    };

    const labelStyle = { font: { bold: true }, alignment: { horizontal: "left" } };
    const currencyStyle = { numFmt: '"R$ "#,##0.00' };

    // --- Construção da Planilha ---
    const wb = XLSX.utils.book_new();
    
    const periodLabels: Record<string, string> = {
      today: "HOJE",
      week: "SEMANA",
      month: "MÊS",
      year: "ANO",
      custom: "PERSONALIZADO"
    };

    // Estilo para o Branding
    const brandStyle = { font: { bold: true, sz: 16, color: { rgb: "1E293B" } } };
    const subtitleStyle = { font: { sz: 10, color: { rgb: "64748B" } } };

    // Preparar dados do resumo
    const summaryData = [
      [{ v: "RELATÓRIO FINANCEIRO", s: { ...sectionHeaderStyle, font: { ...sectionHeaderStyle.font, sz: 14 } } }, "", "", "", { v: "ROTTA", s: { ...brandStyle, alignment: { horizontal: "right" } } }],
      ["", "", "", "", { v: "Gestão de Entregas", s: { ...subtitleStyle, alignment: { horizontal: "right" } } }],
      [], // Espaçador
      [{ v: "RESUMO DO PERÍODO", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }],
      [{ v: "Período", s: labelStyle }, { v: periodLabels[period] || period.toUpperCase() }],
      [{ v: "Total de Corridas", s: labelStyle }, { v: stats.count }],
      [{ v: "Total Bruto", s: labelStyle }, { v: stats.totalValue, t: 'n', s: currencyStyle }],
      [{ v: "Total Pago", s: labelStyle }, { v: totalPaid, t: 'n', s: currencyStyle }],
      [{ v: "Total Pendente", s: labelStyle }, { v: totalPending, t: 'n', s: currencyStyle }],
      [{ v: "Média por Corrida", s: labelStyle }, { v: stats.ticketMedio, t: 'n', s: currencyStyle }],
      [{ v: "Projeção Mensal", s: labelStyle }, { v: stats.projection, t: 'n', s: currencyStyle }],
      [], // Separador
      [{ v: "DETALHAMENTO DAS CORRIDAS", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }],
      [
        { v: "Data", s: headerStyle },
        { v: "Cliente", s: headerStyle },
        { v: "Local", s: headerStyle },
        { v: "Valor", s: headerStyle },
        { v: "Status", s: headerStyle }
      ]
    ];

    // Preparar dados das corridas
    const rideRows = rides.map(ride => [
      { v: ride.rideDate ? format(new Date(ride.rideDate), "dd/MM/yy HH:mm") : "---" },
      { v: ride.clientName || "Cliente" },
      { v: ride.location || "---" },
      { v: ride.value, t: 'n', s: currencyStyle },
      { v: ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente', s: { font: { color: { rgb: ride.paymentStatus === 'PAID' ? "10B981" : "F59E0B" }, bold: true } } }
    ]);

    const finalData = [...summaryData, ...rideRows];
    const ws = XLSX.utils.aoa_to_sheet(finalData);

    // Definir larguras de colunas
    ws["!cols"] = [
      { wch: 18 }, // Data
      { wch: 25 }, // Cliente
      { wch: 30 }, // Local
      { wch: 15 }, // Valor
      { wch: 12 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");

    const monthName = format(new Date(), "MMMM", { locale: ptBR });
    const year = format(new Date(), "yyyy");
    const fileName = period === 'month'
      ? `Planilha_Financeira_${monthName.charAt(0).toUpperCase() + monthName.slice(1)}_${year}.xlsx`
      : `Planilha_Financeira_${periodLabels[period] || period.toUpperCase()}_${format(new Date(), "dd_MM_yyyy")}.xlsx`;

    // --- Download ---
    XLSX.writeFile(wb, fileName);
  };

  return {
    exportToCSV
  };
}
