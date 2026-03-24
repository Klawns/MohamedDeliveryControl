"use client";

import { motion } from "framer-motion";
import { Calendar, ChevronRight, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";

interface RecentActivitiesProps {
    rides: any[];
    isLoading: boolean;
    onEditRide: (ride: any) => void;
    onDeleteRide: (ride: any) => void;
}

export function RecentActivities({
    rides,
    isLoading,
    onEditRide,
    onDeleteRide
}: RecentActivitiesProps) {
    if (isLoading) {
        return (
            <div className="p-8 rounded-3xl border border-border-subtle bg-card-background h-full flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-text-primary tracking-tight">Atividades Recentes</h2>
                </div>
                <div className="space-y-6 flex-1 flex flex-col">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-secondary/10 animate-pulse rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 rounded-3xl border border-border-subtle bg-card-background h-full flex flex-col overflow-hidden shadow-sm min-h-0"
        >
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <h2 className="text-xl font-black text-text-primary tracking-tight">Atividades Recentes</h2>
                <Link href="/dashboard/rides" className="text-sm text-icon-brand hover:text-icon-brand/80 font-bold flex items-center gap-1 transition-colors uppercase tracking-widest text-[10px]">
                    Ver histórico <ChevronRight size={14} />
                </Link>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {rides.length === 0 ? (
                    <p className="text-text-secondary text-center py-10 text-sm italic font-medium">Nenhuma atividade registrada no período.</p>
                ) : (
                    <div className="space-y-4">
                        {rides.map((ride: any) => (
                             <div
                                key={ride.id}
                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-hover-accent transition-all border border-transparent hover:border-border-subtle group"
                            >
                                <div className="p-3 rounded-xl bg-icon-info/10 text-icon-info border border-icon-info/10 group-hover:bg-icon-info/20">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-text-primary truncate tracking-tight">ID: {ride.id?.split("-")[0] || "---"}</h4>
                                    <p className="text-[10px] text-text-secondary mt-0.5 font-bold uppercase tracking-wider">{new Date(ride.rideDate || ride.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right flex flex-col items-end">
                                        <p className="font-black text-text-primary tracking-tighter">{formatCurrency(ride.value)}</p>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full text-center block w-fit mt-1 border",
                                            ride.paymentStatus === 'PAID'
                                                ? "text-icon-success bg-icon-success/10 border-icon-success/10"
                                                : "text-icon-warning bg-icon-warning/10 border-icon-warning/10"
                                        )}>
                                            {ride.paymentStatus === 'PAID' ? "Pago" : "Pendente"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                        <button
                                            onClick={() => onEditRide(ride)}
                                            className="p-2.5 bg-icon-info/10 hover:bg-icon-info text-icon-info hover:text-white rounded-xl transition-all active:scale-90 border border-icon-info/10 shadow-sm"
                                            title="Editar"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteRide(ride)}
                                            className="p-2.5 bg-icon-destructive/10 hover:bg-icon-destructive text-icon-destructive hover:text-white rounded-xl transition-all active:scale-90 border border-icon-destructive/10 shadow-sm"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
