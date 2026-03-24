"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Zap } from "lucide-react";

export function IntroStep() {
    return (
        <div className="space-y-6">
            <div className="aspect-[4/3] md:aspect-video bg-slate-800/50 rounded-3xl md:rounded-[2.5rem] border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600/10 to-transparent"
                >
                    <LayoutDashboard size={80} className="md:w-[100px] md:h-[100px] text-blue-500/20" />
                </motion.div>

                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="p-4 md:p-5 bg-blue-600 rounded-full shadow-2xl shadow-blue-600/40 animate-pulse">
                        <Zap className="text-white fill-current md:w-8 md:h-8" size={24} />
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Mídia de Demonstração</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-4 md:p-8">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="hidden xs:flex w-1 h-8 md:h-12 bg-blue-600 rounded-full" />
                        <div>
                            <h4 className="text-white font-black text-sm md:text-lg italic uppercase tracking-tighter">Velocidade Máxima</h4>
                            <p className="text-slate-400 text-[10px] md:text-sm font-medium">Registro ultra-rápido para quem está na rua.</p>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-base md:text-lg">
                O Rotta foi desenhado para profissionais que valorizam cada segundo.
                Esqueça cadernetas ou planilhas. Aqui seu foco é rodar, o nosso é <span className="text-blue-400 font-bold underline decoration-blue-500/30 underline-offset-4">organizar seu faturamento</span> automaticamente.
            </p>
        </div>
    );
}
