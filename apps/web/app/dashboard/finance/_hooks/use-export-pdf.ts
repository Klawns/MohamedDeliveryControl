'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/api-error';
import {
  financeService,
  type FinanceDashboardParams,
} from '@/services/finance-service';
import { exportRidesPdf } from '@/services/pdf-export.service';

interface UseExportPdfParams {
  dashboardParams: FinanceDashboardParams | null;
  expectedRideCount: number;
  isFinanceDataPending: boolean;
  userName: string;
}

export function useExportPdf({
  dashboardParams,
  expectedRideCount,
  isFinanceDataPending,
  userName,
}: UseExportPdfParams) {
  const mutation = useMutation({
    mutationFn: async ({
      currentDashboardParams,
      currentExpectedRideCount,
    }: {
      currentDashboardParams: FinanceDashboardParams;
      currentExpectedRideCount: number;
    }) => {
      const report = await financeService.getReport(currentDashboardParams);

      return exportRidesPdf({
        rides: report.rides,
        expectedRideCount: currentExpectedRideCount,
        period: currentDashboardParams.period,
        paymentStatus: currentDashboardParams.paymentStatus,
        userName,
        dateRange: report.period,
      });
    },
    onError: (error) => {
      toast.error(parseApiError(error, 'Erro ao exportar PDF.'));
    },
  });

  const handleExportPDF = async () => {
    if (isFinanceDataPending || mutation.isPending || !dashboardParams) {
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        currentDashboardParams: dashboardParams,
        currentExpectedRideCount: expectedRideCount,
      });

      if (!result.ok && result.reason === 'missing-filtered-rides') {
        toast.error(
          'Nao foi possivel montar o PDF com as corridas do filtro atual.',
        );
      }

      if (!result.ok && result.reason === 'empty') {
        toast.error('Sem dados para exportar no periodo selecionado.');
      }
    } catch {
      return;
    }
  };

  return {
    isExportingPdf: mutation.isPending,
    handleExportPDF,
  };
}
