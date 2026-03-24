"use client";

import { SimulatorNavigation } from "../simulator-navigation";

export function NavigationStep() {
    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                <SimulatorNavigation />
            </div>
            <p className="text-slate-400 leading-relaxed text-sm">
                No menu lateral (ou no topo em mobile), você navega entre suas listas.
                <span className="text-primary font-bold block mt-2">Dica: O Dashboard mostra um resumo rápido do dia assim que você abre o app.</span>
            </p>
        </div>
    );
}
