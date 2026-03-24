"use client";

import { useState } from "react";
import { PDFService } from "@/services/pdf-service";
import { FinanceStats, PeriodId, ExportState, RecentRide } from "../_types";

interface UseExportPdfParams {
    viewStats: FinanceStats | null;
    rides: RecentRide[];
    selectedPeriod: PeriodId;
    userName: string;
}

export function useExportPdf({ viewStats, rides, selectedPeriod, userName }: UseExportPdfParams) {
    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [pixKey, setPixKey] = useState("");
    const [statsToExport, setStatsToExport] = useState<{ period: PeriodId; stats: FinanceStats; rides: RecentRide[] } | null>(null);

    const handleExportPDF = () => {
        if (!viewStats || !rides.length) return;

        setStatsToExport({ period: selectedPeriod, stats: viewStats, rides });
        setIsPixModalOpen(true);
    };

    const confirmExport = (includePix: boolean) => {
        if (!statsToExport) return;

        // Note: PDFService might need an update if it expects FinanceRide[] instead of RecentRide[]
        // But for now we cast to maintain compatibility if the fields match
        PDFService.generateReport(statsToExport.rides as any, {
            period: statsToExport.period,
            userName,
            pixKey: includePix && pixKey.trim() !== "" ? pixKey : undefined,
        });

        setIsPixModalOpen(false);
        setStatsToExport(null);
    };

    return {
        isPixModalOpen,
        setIsPixModalOpen,
        pixKey,
        setPixKey,
        handleExportPDF,
        confirmExport,
    };
}
