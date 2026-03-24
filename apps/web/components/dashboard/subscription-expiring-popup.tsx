"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowUpRight, X, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SubscriptionExpiringPopupProps {
    daysRemaining: number;
}

export function SubscriptionExpiringPopup({ daysRemaining }: SubscriptionExpiringPopupProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    if (daysRemaining < 0) return null;

    return (
        <AnimatePresence mode="wait">
            {isOpen ? (
                <motion.div
                    key="expiring-popup"
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 1.1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed z-[100] bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-full md:max-w-[320px]"
                >
                    <div className="relative overflow-hidden p-6 rounded-3xl border border-red-500/30 bg-red-500/10 shadow-2xl shadow-red-500/10 backdrop-blur-xl">
                        {/* Background Glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 blur-[50px] opacity-20 rounded-full bg-red-500" />

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="p-3 rounded-2xl bg-red-500/20 text-red-400">
                                    <AlertCircle size={24} className="animate-pulse" />
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-500 hover:text-white transition-colors p-1"
                                    title="Minimizar"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div>
                                <h4 className="text-white font-bold text-lg tracking-tight">
                                    Assinatura Expirando!
                                </h4>
                                <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                                    Sua assinatura premium vence em <span className="text-red-500 font-black px-1.5 py-0.5 bg-red-500/10 rounded-md">{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</span>.
                                </p>
                                <p className="text-slate-400 text-xs mt-2">
                                    Renove agora para não perder o acesso às funcionalidades premium.
                                </p>
                            </div>

                            <button
                                onClick={() => router.push("/dashboard/settings")}
                                className="w-full py-3 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-400 transition-all active:scale-[0.98] shadow-lg shadow-red-500/25"
                            >
                                Renovar Agora
                                <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.button
                    key="expiring-collapsed"
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] p-4 rounded-2xl border border-red-500/30 bg-red-500/20 text-red-400 shadow-2xl backdrop-blur-xl hover:bg-red-500/30 transition-all group"
                    title="Ver aviso de expiração"
                >
                    <Calendar size={20} className="group-hover:animate-bounce" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#09090b]" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
