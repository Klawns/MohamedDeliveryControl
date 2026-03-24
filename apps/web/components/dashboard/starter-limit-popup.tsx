"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bike, ArrowUpRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarterLimitPopupProps {
    rideCount: number;
    limit?: number;
}

export function StarterLimitPopup({ rideCount, limit = 20 }: StarterLimitPopupProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    const remaining = Math.max(0, limit - rideCount);
    const percentage = Math.min(100, (rideCount / limit) * 100);

    // Níveis de alerta
    const isWarning = remaining <= 10 && remaining > 5;
    const isCritical = remaining <= 5;
    const isCrisis = remaining <= 10;

    return (
        <AnimatePresence mode="wait">
            {isOpen ? (
                <motion.div
                    key="full-popup"
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 1.1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed z-[100] bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-full md:max-w-[280px]"
                >
                    <div className={cn(
                        "relative overflow-hidden p-5 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-500",
                        isCritical
                            ? "bg-red-500/10 border-red-500/30 shadow-red-500/10"
                            : isWarning
                                ? "bg-amber-500/10 border-amber-500/30 shadow-amber-500/10"
                                : "bg-lime-500/10 border-lime-500/30 shadow-lime-500/10"
                    )}>
                        {/* Background Glow */}
                        <div className={cn(
                            "absolute -top-10 -right-10 w-24 h-24 blur-[40px] opacity-20 rounded-full",
                            isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-lime-500"
                        )} />

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className={cn(
                                    "p-2.5 rounded-2xl",
                                    isCritical
                                        ? "bg-red-500/20 text-red-400"
                                        : isWarning
                                            ? "bg-amber-500/20 text-amber-400"
                                            : "bg-lime-500/20 text-lime-400"
                                )}>
                                    <Bike size={20} className={cn(isCrisis && "animate-bounce")} />
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-500 hover:text-white transition-colors p-1"
                                    title="Minimizar"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div>
                                <h4 className="text-white font-bold text-sm tracking-tight">
                                    {isCritical ? "Limite Crítico!" : isWarning ? "Limite Próximo!" : "Status do Plano Starter"}
                                </h4>
                                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                    {remaining === 0
                                        ? "Seu limite acabou. Faça upgrade para continuar."
                                        : `Restam ${remaining} de ${limit} corridas gratuitas.`}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-lime-500"
                                    )}
                                />
                            </div>

                            <button
                                onClick={() => router.push("/pricing")}
                                className={cn(
                                    "w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                                    isCritical
                                        ? "bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20"
                                        : isWarning
                                            ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                                            : "bg-lime-500 text-black hover:bg-lime-400 shadow-lg shadow-lime-500/20"
                                )}
                            >
                                {isCrisis ? "Fazer Upgrade Agora" : "Assinar Premium"}
                                <ArrowUpRight size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.button
                    key="collapsed-button"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-500 group",
                        isCritical
                            ? "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                            : isWarning
                                ? "bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
                                : "bg-lime-500/20 border-lime-500/30 text-lime-400 hover:bg-lime-500/30"
                    )}
                    title="Ver status do plano"
                >
                    <Bike size={20} className={cn(isCrisis && "group-hover:animate-bounce")} />
                    <div className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#09090b]",
                        isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-lime-500"
                    )} />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
