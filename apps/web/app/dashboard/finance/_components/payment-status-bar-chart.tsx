'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import {
  FinanceByStatus,
  FinancePaymentStatusFilter,
} from '@/services/finance-service';
import { usePaymentStatusChart } from '../_hooks/use-payment-status-chart';

interface PaymentStatusBarChartProps {
  data: FinanceByStatus[];
  isLoading?: boolean;
  paymentStatusFilter: FinancePaymentStatusFilter;
}

function ChartSkeleton() {
  return (
    <div className="h-[400px] w-full animate-pulse rounded-[3rem] bg-card/10" />
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[400px] items-center justify-center rounded-[3rem] border border-border bg-card/10 font-medium text-muted-foreground">
      {message}
    </div>
  );
}

export function PaymentStatusBarChart({
  data,
  isLoading,
  paymentStatusFilter,
}: PaymentStatusBarChartProps) {
  const { chartData, hasData } = usePaymentStatusChart({ data });

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!hasData) {
    return <EmptyChartState message="Nenhum status financeiro no periodo" />;
  }

  return (
    <div className="rounded-[3rem] border border-border bg-card/40 p-8 backdrop-blur-xl">
      <div className="mb-8">
        <h3 className="text-xl font-black text-foreground">Status Financeiro</h3>
        <p className="text-xs font-medium text-muted-foreground">
          {paymentStatusFilter === 'all'
            ? 'Valores pagos e pendentes no periodo selecionado'
            : `Valores de corridas ${paymentStatusFilter === 'PAID' ? 'pagas' : 'pendentes'} no periodo selecionado`}
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barCategoryGap={32}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 700 }}
              className="text-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(Number(value))}
              className="text-muted-foreground"
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1.5rem',
                padding: '12px 16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
              itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
              labelStyle={{
                color: '#94a3b8',
                fontSize: '12px',
                marginBottom: '4px',
                textTransform: 'uppercase',
                fontWeight: 'black',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Total']}
            />
            <Bar dataKey="value" radius={[18, 18, 6, 6]} animationDuration={1500}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
