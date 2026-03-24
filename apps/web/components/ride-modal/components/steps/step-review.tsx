"use client";

import { motion } from "framer-motion";
import { User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client, PaymentStatus } from "@/types/rides";

interface StepReviewProps {
    clients: Client[];
    selectedClientId: string;
    clientName?: string;
    value: string;
    paymentStatus: PaymentStatus;
    location: string;
    rideDate?: string;
    notes?: string;
    photo?: string | null;
}

export function StepReview({
    clients,
    selectedClientId,
    clientName,
    value,
    paymentStatus,
    location,
    rideDate,
    notes,
    photo
}: StepReviewProps) {
    const selectedClient = clients.find((c) => c.id === selectedClientId);

    return (
        <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
        >
            <div className="bg-secondary/10 border border-border-subtle rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-icon-success/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                <div className="flex items-center gap-4 pb-6 border-b border-border-subtle relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-icon-info/10 flex items-center justify-center text-icon-info border border-icon-info/10 shadow-inner">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] leading-none mb-1.5 opacity-70">Cliente Final</p>
                        <p className="text-text-primary font-display font-extrabold text-lg tracking-tight leading-none">{selectedClient?.name || clientName || "Não identificado"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 py-2 relative z-10">
                    <div className="p-4 rounded-3xl bg-secondary/20 border border-border-subtle shadow-inner">
                        <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-2.5 opacity-70">Valor Total</p>
                        <p className="text-3xl font-display font-extrabold text-text-primary tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
                        </p>
                    </div>
                    <div className="p-4 rounded-3xl bg-secondary/20 border border-border-subtle shadow-inner">
                        <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-2.5 opacity-70">Pagamento</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className={cn(
                                "text-[10px] font-bold uppercase px-3.5 py-1.5 rounded-full border shadow-sm",
                                paymentStatus === 'PAID' 
                                    ? "bg-icon-success/10 text-icon-success border-icon-success/20" 
                                    : "bg-icon-warning/10 text-icon-warning border-icon-warning/20"
                            )}>{paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 p-4 rounded-3xl bg-secondary/20 border border-border-subtle shadow-inner relative z-10">
                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1.5 opacity-70">Localização do Serviço</p>
                    <p className="text-sm text-text-primary font-bold tracking-tight">{location || "Nenhuma localização informada"}</p>
                </div>

                {(rideDate || notes || photo) && (
                    <div className="pt-6 border-t border-border-subtle space-y-6 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {rideDate && (
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1.5 opacity-70">Data Agendada</p>
                                    <p className="text-sm text-text-secondary font-bold tracking-tight">{new Date(rideDate).toLocaleString()}</p>
                                </div>
                            )}
                            {photo && (
                                <div className="flex items-center gap-2 text-icon-info pt-1">
                                    <div className="p-2 rounded-xl bg-icon-info/10">
                                        <Camera size={14} />
                                    </div>
                                     <span className="text-[10px] font-bold uppercase tracking-widest">Foto do Serviço Anexada</span>
                                </div>
                            )}
                        </div>
                        {notes && (
                            <div className="p-4 rounded-2xl bg-secondary/10 border border-border-subtle italic text-text-secondary text-sm font-medium">
                                 <p className="text-[8px] font-bold uppercase tracking-[0.2em] mb-2 normal-case non-italic opacity-50">Observações Internas:</p>
                                "{notes}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
