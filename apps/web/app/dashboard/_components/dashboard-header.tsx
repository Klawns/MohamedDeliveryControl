"use client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardHeaderProps {
    userName: string;
    period: 'today' | 'week';
    setPeriod: (period: 'today' | 'week') => void;
}

export function DashboardHeader({ userName, period, setPeriod }: DashboardHeaderProps) {
    const firstName = userName?.split(" ")[0] || "Usuário";

    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-display font-extrabold text-text-primary tracking-tight">Olá, {firstName}!</h1>
                <p className="text-text-secondary mt-1 font-medium">Aqui está o resumo das suas atividades.</p>
            </div>
            <div className="flex items-center gap-4 self-start md:self-center">
                <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-2xl border border-border-subtle shadow-inner">
                    <button
                        onClick={() => setPeriod('today')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95", 
                            period === 'today' 
                                ? "bg-button-primary text-button-primary-foreground shadow-lg shadow-button-shadow" 
                                : "text-text-secondary hover:text-text-primary hover:bg-secondary/20"
                        )}
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => setPeriod('week')}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95", 
                            period === 'week' 
                                ? "bg-button-primary text-button-primary-foreground shadow-lg shadow-button-shadow" 
                                : "text-text-secondary hover:text-text-primary hover:bg-secondary/20"
                        )}
                    >
                        Semana
                    </button>
                </div>
                <ThemeToggle />
            </div>
        </header>
    );
}
