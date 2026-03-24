"use client";

import { useMemo } from "react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO, subDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RidesChartProps {
    rides: any[];
    className?: string;
}

export function RidesChart({ rides, className }: RidesChartProps) {
    const chartData = useMemo(() => {
        // Obter os últimos 7 dias
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), i);
            return format(date, "yyyy-MM-dd");
        }).reverse();

        // Agrupar ganhos por dia
        const earningsByDay = rides.reduce((acc: any, ride) => {
            const date = format(parseISO(ride.createdAt), "yyyy-MM-dd");
            if (!acc[date]) acc[date] = 0;
            acc[date] += ride.value || 0;
            return acc;
        }, {});

        // Formatar para o gráfico
        return last7Days.map(date => ({
            date: format(parseISO(date), "dd/MM", { locale: ptBR }),
            value: earningsByDay[date] || 0,
            fullDate: format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })
        }));
    }, [rides]);

    const totalPeriod = useMemo(() =>
        chartData.reduce((acc, curr) => acc + curr.value, 0)
        , [chartData]);

    // if (!rides.length) return null;

    return (
        <div className={cn("bg-card/40 rounded-3xl border border-border p-6 space-y-4 flex flex-col min-h-0", className)}>
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Desempenho (7 dias)</h3>
                    <p className="text-xl font-black text-foreground mt-1">{formatCurrency(totalPeriod)}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
            </div>

            <div className="h-[280px] w-full mt-4 lg:flex-1 lg:h-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold' }}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-card border border-border p-3 rounded-2xl shadow-2xl backdrop-blur-md">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{payload[0].payload.fullDate}</p>
                                            <p className="text-lg font-black text-primary">{formatCurrency(payload[0].value as number)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--color-primary)"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
