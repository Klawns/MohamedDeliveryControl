"use client";

import { Client, Ride, ClientBalance } from "@/types/rides";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";

export function useExportClientDebt() {
  const exportToExcel = (
    client: Client,
    rides: Ride[],
    payments: any[],
    balance: ClientBalance,
    options: { userName: string }
  ) => {
    if (!client || !balance) return;

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
    const brandStyle = { font: { bold: true, sz: 16, color: { rgb: "1E293B" } } };
    const subtitleStyle = { font: { sz: 10, color: { rgb: "64748B" } } };

    // --- Construção da Planilha ---
    const wb = XLSX.utils.book_new();

    // Preparar dados do resumo
    const summaryData = [
      [{ v: "DETALHAMENTO DE DÍVIDA", s: { ...sectionHeaderStyle, font: { ...sectionHeaderStyle.font, sz: 14 } } }, "", "", "", { v: "ROTTA", s: { ...brandStyle, alignment: { horizontal: "right" } } }],
      ["", "", "", "", { v: "Gestão de Entregas", s: { ...subtitleStyle, alignment: { horizontal: "right" } } }],
      [], // Espaçador
      [{ v: "INFORMAÇÕES DO CLIENTE", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }],
      [{ v: "Cliente", s: labelStyle }, { v: client.name }],
      [{ v: "Motorista", s: labelStyle }, { v: options.userName }],
      [{ v: "Gerado em", s: labelStyle }, { v: format(new Date(), "dd/MM/yyyy HH:mm") }],
      [], 
      [{ v: "RESUMO FINANCEIRO", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }],
      [{ v: "Total em Corridas", s: labelStyle }, { v: balance.totalDebt, t: 'n', s: currencyStyle }],
      [{ v: "Total Pago (Parcial)", s: labelStyle }, { v: balance.totalPaid, t: 'n', s: currencyStyle }],
      [{ v: "Saldo Devedor Atual", s: { ...labelStyle, font: { ...labelStyle.font, color: { rgb: "DC2626" } } } }, { v: balance.remainingBalance, t: 'n', s: { ...currencyStyle, font: { bold: true, color: { rgb: "DC2626" } } } }],
      [],
      [{ v: "HISTÓRICO DE CORRIDAS PENDENTES", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }, { v: "", s: sectionHeaderStyle }],
      [
        { v: "Data", s: headerStyle },
        { v: "ID Corrida", s: headerStyle },
        { v: "Valor", s: headerStyle },
        { v: "Status", s: headerStyle }
      ]
    ];

    // Filtrar apenas corridas pendentes para o relatório de dívida (ou todas?)
    // O usuário pediu "PDF de dívidas", que geralmente foca no que está em aberto.
    // Vou incluir todas as enviadas para o hook.
    const rideRows = rides.map(ride => [
      { v: ride.rideDate ? format(new Date(ride.rideDate), "dd/MM/yy HH:mm") : "---" },
      { v: String(ride.id).split("-")[0] },
      { v: ride.value, t: 'n', s: currencyStyle },
      { v: ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente', s: { font: { color: { rgb: ride.paymentStatus === 'PAID' ? "10B981" : "F59E0B" }, bold: true } } }
    ]);

    const finalData = [...summaryData, ...rideRows];
    const ws = XLSX.utils.aoa_to_sheet(finalData);

    // Definir larguras de colunas
    ws["!cols"] = [
      { wch: 18 }, // Data
      { wch: 15 }, // ID
      { wch: 15 }, // Valor
      { wch: 12 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Divida");

    const fileName = `Divida_${client.name.replace(/\s+/g, '_')}_${format(new Date(), "dd_MM_yyyy")}.xlsx`;

    // --- Download ---
    XLSX.writeFile(wb, fileName);
  };

  return {
    exportToExcel
  };
}
