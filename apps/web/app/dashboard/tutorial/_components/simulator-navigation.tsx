"use client";

import { Bike, LayoutDashboard, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimulatorNavigation() {
    const items = [
        { icon: LayoutDashboard, label: "Visão Geral", desc: "Seu resumo de ganhos", color: "text-blue-400" },
        { icon: Users, label: "Clientes", desc: "Lista de todos seus clientes", color: "text-primary" },
        { icon: Bike, label: "Corridas", desc: "Histórico completo com filtros", color: "text-blue-400" },
        { icon: Wallet, label: "Financeiro", desc: "Exportação de PDFs e cobranças", color: "text-amber-400" },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2rem] overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Mock Explorer</span>
                </div>
                <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {items.map((item) => (
                        <div key={item.label} className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5 flex items-center gap-3 md:gap-4 group">
                            <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", item.color)}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white leading-none">{item.label}</h4>
                                <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
