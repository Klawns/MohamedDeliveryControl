"use client";

import { History, BarChart3 } from "lucide-react";

export function SummaryStep() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-8 bg-slate-800/40 rounded-[2rem] border border-white/5 text-center group hover:bg-primary/10 transition-all">
                    <History className="mx-auto text-primary mb-4 group-hover:scale-110 transition-transform" size={40} />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Histórico</p>
                </div>
                <div className="p-8 bg-slate-800/40 rounded-[2rem] border border-white/5 text-center group hover:bg-blue-500/10 transition-all">
                    <BarChart3 className="mx-auto text-blue-400 mb-4 group-hover:scale-110 transition-transform" size={40} />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Ganhos</p>
                </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                Acompanhe o <span className="text-blue-400 font-bold">Dashboard Financeiro</span> com gráficos de desempenho, veja quanto cada cliente deve e receba sugestões para otimizar suas rotas.
                <span className="text-blue-400 font-bold block mt-2 whitespace-nowrap overflow-hidden text-ellipsis">Dica: Sincronização em tempo real e visual ultra-premium.</span>
            </p>
        </div>
    );
}
