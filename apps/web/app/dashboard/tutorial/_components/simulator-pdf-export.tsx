"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, CalendarDays, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SimulatorPDFExport() {
    const [period, setPeriod] = useState("day");

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden group">
                <div className="space-y-4 md:space-y-6 relative z-10">
                    <div className="space-y-2">
                        <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Selecione o Período</h4>
                        <div className="flex gap-1.5 md:gap-2">
                            {[
                                { id: "day", label: "Hoje", icon: Calendar },
                                { id: "week", label: "Semana", icon: CalendarDays },
                                { id: "month", label: "Mês", icon: DollarSign }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id)}
                                    className={cn(
                                        "flex-1 h-10 md:h-12 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 font-bold text-[10px] md:text-xs transition-all border",
                                        period === p.id
                                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                            : "bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-800/80"
                                    )}
                                >
                                    <p.icon size={12} className="md:w-3.5 md:h-3.5" />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 md:p-6 bg-slate-950 border border-white/5 rounded-2xl md:rounded-3xl space-y-2 md:space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Preview PDF</span>
                            <div className="h-4 md:h-6 px-1.5 md:px-2 bg-primary/10 text-primary rounded-md text-[6px] md:text-[8px] font-black flex items-center tracking-tighter uppercase">PRONTO</div>
                        </div>
                        <div className="h-0.5 w-full bg-white/5" />
                        <div className="space-y-1.5 md:space-y-3 opacity-60">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center justify-between text-[7px] md:text-[10px] font-medium text-slate-400">
                                    <div className="flex gap-1.5 md:gap-2">
                                        <div className="w-4 md:w-8 h-1 md:h-2 bg-white/10 rounded" />
                                        <div className="w-8 md:w-16 h-1 md:h-2 bg-white/10 rounded" />
                                    </div>
                                    <div className="w-6 md:w-10 h-1 md:h-2 bg-white/10 rounded" />
                                </div>
                            ))}
                        </div>
                        <div className="h-0.5 w-full bg-white/5" />
                        <div className="flex items-center justify-between font-black text-white text-[9px] md:text-xs">
                            <span>TOTAL NO PERÍODO</span>
                            <span className="text-blue-400 whitespace-nowrap">R$ {period === 'day' ? '125,00' : period === 'week' ? '850,00' : '3.420,00'}</span>
                        </div>
                    </div>

                    <Button className="w-full h-12 md:h-14 bg-white text-slate-950 hover:bg-white/90 font-black rounded-xl md:rounded-2xl text-xs md:text-lg shadow-lg">
                        Baixar PDF <ArrowRight className="ml-1 md:ml-2" size={18} />
                    </Button>
                </div>

                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/5 blur-[100px] -ml-32 -mb-32 rounded-full" />
            </div>
        </div>
    );
}
