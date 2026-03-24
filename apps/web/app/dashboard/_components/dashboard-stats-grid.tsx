"use client";

import { motion } from "framer-motion";
import { Bike, Wallet } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface DashboardStatsGridProps {
    count: number;
    totalValue: number;
    period: 'today' | 'week';
    isLoading: boolean;
}

export function DashboardStatsGrid({ count, totalValue, period, isLoading }: DashboardStatsGridProps) {
    const stats = [
        {
            label: `Corridas ${period === 'today' ? 'Hoje' : 'na Semana'}`,
            value: String(count),
            icon: Bike,
            bg: period === 'today' ? "bg-icon-info/10" : "bg-icon-warning/10",
            text: period === 'today' ? "text-icon-info" : "text-icon-warning"
        },
        {
            label: "Faturamento",
            value: formatCurrency(totalValue),
            icon: Wallet,
            bg: "bg-icon-brand/10",
            text: "text-icon-brand"
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="h-40 bg-secondary/10 animate-pulse rounded-3xl" />)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-3xl border border-border-subtle bg-card-background relative overflow-hidden group shadow-sm hover:shadow-md hover:bg-hover-accent transition-all active:scale-[0.99]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div className={cn("p-4 rounded-2xl border", stat.bg, stat.bg.replace('/10', '/5').replace('bg-', 'border-'))}>
                            <stat.icon size={24} className={stat.text} />
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
                        <h3 className="text-4xl font-display font-extrabold text-text-primary mt-1 tracking-tighter">{stat.value}</h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
