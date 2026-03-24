"use client";

import { motion } from "framer-motion";
import { Wallet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { FinanceStats, Period } from "../_types";

interface StatsCardProps {
    viewStats: FinanceStats | null;
    isLoading: boolean;
    currentPeriod: Period;
    onExport: () => void;
    onExportCSV: () => void;
}

export function StatsCard({
    viewStats,
    isLoading,
    currentPeriod,
    onExport,
    onExportCSV,
}: StatsCardProps) {
    return (
        <div className="grid grid-cols-1">
            <motion.div
                layoutId="stats-card"
                className={cn(
                    "p-1 rounded-[3rem] bg-gradient-to-br transition-all duration-500",
                    currentPeriod.color === 'bg-primary' ? "from-primary/20 to-transparent" : `from-${currentPeriod.color.replace('bg-', '')}/20 to-transparent`
                )}
            >
                <div className="bg-card-background rounded-[2.8rem] p-10 md:p-14 border border-border-subtle relative overflow-hidden">
                    {/* Indicador Lateral de Cor */}
                    <div className={cn("absolute top-0 left-0 w-2 h-full", currentPeriod.color)} />

                    <div className="flex flex-col items-center text-center">
                        <div className={cn("p-6 rounded-3xl mb-8 shadow-2xl transition-colors duration-500", currentPeriod.color + "/20", currentPeriod.text)}>
                            <Wallet size={48} />
                        </div>

                        <span className={cn("text-[10px] font-bold uppercase tracking-[.3em] mb-4", currentPeriod.text)}>
                            Resumo {currentPeriod.label}
                        </span>

                        <div className={cn(
                            "transition-all duration-700 w-full flex flex-col items-center",
                            isLoading ? "opacity-30 blur-md scale-95" : "opacity-100 blur-0 scale-100"
                        )}>
                            <h3 className="text-6xl md:text-8xl font-display font-extrabold text-text-primary tracking-tighter mb-4">
                                {formatCurrency(viewStats?.totalValue || 0)}
                            </h3>
                            
                            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8">
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-2 w-2 rounded-full animate-pulse", currentPeriod.color)} />
                                    <p className="text-slate-400 text-sm md:text-lg font-bold">
                                        {viewStats?.count || 0} corridas
                                    </p>
                                </div>

                                {viewStats && viewStats.ticketMedio > 0 && (
                                    <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-muted/50 border border-border-subtle">
                                        <p className="text-text-secondary text-xs md:text-sm font-medium">Média por Corrida:</p>
                                        <p className="text-text-primary text-sm md:text-base font-bold">{formatCurrency(viewStats.ticketMedio)}</p>
                                    </div>
                                )}

                                {viewStats && viewStats.previousPeriodComparison !== 0 && (
                                    <div className={cn(
                                        "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold",
                                        viewStats.previousPeriodComparison > 0 ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-400"
                                    )}>
                                        {viewStats.previousPeriodComparison > 0 ? "+" : ""}
                                        {viewStats.previousPeriodComparison.toFixed(1)}% vs. {currentPeriod.id === 'today' ? 'ontem' : currentPeriod.label.toLowerCase() + ' anterior'}
                                    </div>
                                )}
                            </div>

                            {viewStats && viewStats.projection > 0 && (
                                <div className="mb-10 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 max-w-xs w-full">
                                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Projeção Mensal</p>
                                    <p className="text-2xl text-text-primary font-display font-extrabold">{formatCurrency(viewStats.projection)}</p>
                                    <p className="text-[10px] text-text-secondary font-medium">Com base no ritmo atual</p>
                                </div>
                            )}

                            <div className="w-full pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-6">
                                <Button
                                    onClick={onExport}
                                    disabled={isLoading || !viewStats?.count}
                                    className={cn(
                                        "w-full md:w-auto px-10 h-16 rounded-2xl text-white font-bold font-display flex items-center gap-4 shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs",
                                        currentPeriod.color,
                                        "hover:opacity-90",
                                        (isLoading || !viewStats?.count) && "grayscale opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <Download size={22} className="shrink-0" />
                                    Exportar PDF {currentPeriod.label}
                                </Button>

                                <Button
                                    onClick={onExportCSV}
                                    disabled={isLoading || !viewStats?.count}
                                    className={cn(
                                        "w-full md:w-auto px-10 h-16 rounded-2xl text-text-primary font-bold font-display flex items-center gap-4 shadow-xl transition-all active:scale-95 border border-border-subtle uppercase tracking-widest text-xs",
                                        "bg-muted/50 hover:bg-hover-accent",
                                        (isLoading || !viewStats?.count) && "grayscale opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <Download size={22} className="text-primary shrink-0" />
                                    Exportar Planilha {currentPeriod.label}
                                </Button>
                            </div>
                        </div>

                        {/* Loading Overlay Sutil */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-transparent z-50">
                                <div className={cn(
                                    "h-16 w-16 border-4 border-t-transparent rounded-full animate-spin",
                                    currentPeriod.border,
                                    "border-t-" + currentPeriod.color.replace('bg-', '')
                                )} />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
