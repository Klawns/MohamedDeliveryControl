"use client";

import { cn, formatCurrency } from "@/lib/utils";

import { StatsSkeleton } from "./stats-skeleton";

interface FinanceSummaryProps {
    today?: number;
    week?: number;
    month?: number;
    isPending?: boolean;
}

export function FinanceSummary({ today, week, month, isPending }: FinanceSummaryProps) {
    if (isPending) return <StatsSkeleton />;

    const stats = [
        { label: "Hoje", val: today, color: "text-filter-today" },
        { label: "Semana", val: week, color: "text-filter-week" },
        { label: "Mês", val: month, color: "text-filter-month" },
    ];

    return (
        <section className="grid grid-cols-3 gap-2">
            {stats.map(s => (
                <div key={s.label} className="bg-card-background border border-border-subtle rounded-2xl p-3 text-center shadow-sm">
                    <p className="text-[10px] uppercase font-display font-bold text-text-muted tracking-wide mb-1">{s.label}</p>
                    <p className={cn("text-sm font-display font-extrabold truncate", s.color)}>
                        {typeof s.val === "number" ? formatCurrency(s.val) : "--"}
                    </p>
                </div>
            ))}
        </section>
    );
}
