export interface FinanceByStatus {
    status: 'PAID' | 'PENDING';
    value: number;
}

export interface FinanceClient {
    id: string;
    name: string;
}

export interface RecentRide {
    id: string;
    value: number;
    rideDate: string;
    paymentStatus: 'PAID' | 'PENDING';
    location?: string;
    clientName: string;
}

export interface FinanceRide {
    id: string;
    clientId: string;
    value: number;
    notes?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID';
    rideDate?: string;
    createdAt: string;
    location?: string;
    client?: {
        name: string;
    };
}

export interface FinanceStats {
    count: number;
    totalValue: number;
    ticketMedio: number;
    previousPeriodComparison: number;
    projection: number;
}

export interface Period {
    id: PeriodId;
    label: string;
    color: string;
    text: string;
    border: string;
    chartColor: string;
}

export type PeriodId = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface ExportState {
    period: PeriodId;
    stats: FinanceStats;
}

export const PERIODS: readonly Period[] = [
    { id: 'today', label: 'Hoje', color: 'bg-primary', text: 'text-primary', border: 'border-primary/20', chartColor: 'var(--color-primary)' },
    { id: 'week', label: 'Semana', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', chartColor: 'var(--color-chart-2)' },
    { id: 'month', label: 'Mês', color: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/20', chartColor: 'var(--color-chart-3)' },
    { id: 'year', label: 'Ano', color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/20', chartColor: 'var(--color-chart-4)' },
    { id: 'custom', label: 'Personalizado', color: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500/20', chartColor: 'var(--color-chart-5)' },
] as const;
