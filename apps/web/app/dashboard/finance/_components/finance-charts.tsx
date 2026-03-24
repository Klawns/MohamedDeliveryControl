"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { formatCurrency } from "@/lib/utils";
import { FinanceTrend, FinanceByClient } from "@/services/finance-service";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RevenueTrendChartProps {
  data: FinanceTrend[];
  color?: string;
  isLoading?: boolean;
}

export function RevenueTrendChart({ data, color = "var(--primary)", isLoading }: RevenueTrendChartProps) {
    if (isLoading) {
        return <div className="h-[400px] w-full bg-card/10 animate-pulse rounded-[3rem]" />;
    }
    
    if (!data?.length) {
        return (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground font-medium border border-border rounded-[3rem] bg-card/10">
                Nenhum dado disponível no período
            </div>
        );
    }

    const gradientId = `colorValue-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

    return (
        <div className="bg-card/40 p-8 rounded-[3rem] border border-border backdrop-blur-xl">
            <div className="mb-8">
                <h3 className="text-xl font-black text-foreground">Evolução de Ganhos</h3>
                <p className="text-xs text-muted-foreground font-medium">Ganhos diários no período selecionado</p>
            </div>
            
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'currentColor', fontSize: 12 }}
                            tickFormatter={(str) => format(parseISO(str), 'dd MMM', { locale: ptBR })}
                            minTickGap={30}
                            className="text-muted-foreground"
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'currentColor', fontSize: 12 }}
                            tickFormatter={(val) => `R$ ${val}`}
                            className="text-muted-foreground"
                        />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '1.5rem',
                padding: '12px 16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'black' }}
              formatter={(value: number) => [formatCurrency(value), 'Ganhos']}
              labelFormatter={(label) => format(parseISO(label), 'dd/MM/yyyy', { locale: ptBR })}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={4}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload || payload.value <= 0) return <circle key={`dot-hidden-${Math.random()}`} cx={cx} cy={cy} r={0} />;
                return (
                    <circle 
                    key={`dot-${payload.date}`}
                    cx={cx} 
                    cy={cy} 
                    r={4} 
                    fill={color} 
                    stroke="#0f172a" 
                    strokeWidth={2} 
                  />
                );
              }}
              activeDot={{ r: 8, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ClientDistributionChartProps {
  data: FinanceByClient[];
  isLoading?: boolean;
}

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)'
];

export function ClientDistributionChart({ data, isLoading }: ClientDistributionChartProps) {
    if (isLoading) {
        return <div className="h-[400px] w-full bg-card/10 animate-pulse rounded-[3rem]" />;
    }

    if (!data?.length) {
        return (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground font-medium border border-border rounded-[3rem] bg-card/10">
                Nenhum dado
            </div>
        );
    }

    return (
        <div className="bg-card/40 p-8 rounded-[3rem] border border-border backdrop-blur-xl">
            <div className="mb-8">
                <h3 className="text-xl font-black text-foreground">Distribuição por Clientes</h3>
                <p className="text-xs text-muted-foreground font-medium">Proporção de ganhos por cliente</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="clientName"
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--card)', 
                                border: '1px solid var(--border)',
                                borderRadius: '1.5rem',
                                padding: '12px 16px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                color: 'var(--foreground)'
                            }}
                            itemStyle={{ color: 'var(--foreground)', fontSize: '14px', fontWeight: 'bold' }}
                            labelStyle={{ color: 'var(--muted-foreground)', fontSize: '12px' }}
                            formatter={(value: number) => [formatCurrency(value), 'Total']}
                        />
                        <Legend 
                             verticalAlign="bottom" 
                             align="center"
                             iconType="circle"
                             wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }}
                             className="text-foreground"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
