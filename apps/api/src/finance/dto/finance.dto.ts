import { z } from 'zod';

export const getFinanceStatsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  start: z.string().optional(),
  end: z.string().optional(),
  clientId: z.string().optional(),
});

export type GetFinanceStatsDto = z.infer<typeof getFinanceStatsSchema>;

export interface FinanceSummaryResponse {
  totalValue: number;
  count: number;
  ticketMedio: number;
  previousPeriodComparison: number; // Porcentagem de crescimento
  projection: number; // Estimativa de fechamento (se aplicável)
}

export interface FinanceTrendItem {
  date: string;
  value: number;
}

export interface FinanceByClientItem {
  clientId: string;
  clientName: string;
  value: number;
}

export interface FinanceByStatusItem {
  status: 'PAID' | 'PENDING';
  value: number;
}

export interface FinanceDashboardResponse {
  summary: FinanceSummaryResponse;
  trends: FinanceTrendItem[];
  byClient: FinanceByClientItem[];
  byStatus: FinanceByStatusItem[];
}
