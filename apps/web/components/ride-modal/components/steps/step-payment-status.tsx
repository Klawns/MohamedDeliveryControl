"use client";

import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentStatus } from "@/types/rides";

interface StepPaymentStatusProps {
    paymentStatus: PaymentStatus;
    setPaymentStatus: (status: PaymentStatus) => void;
}

export function StepPaymentStatus({
    paymentStatus,
    setPaymentStatus
}: StepPaymentStatusProps) {
    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="space-y-4">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                    <DollarSign size={12} /> Status do Pagamento
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-secondary/10 rounded-[2rem] border border-border-subtle shadow-inner">
                    <button
                        type="button"
                        onClick={() => setPaymentStatus('PENDING')}
                        className={cn(
                            "py-4 rounded-[1.75rem] text-[11px] font-black transition-all uppercase tracking-widest active:scale-95",
                            paymentStatus === 'PENDING' 
                                ? "bg-warning text-white shadow-lg shadow-warning/20 scale-[1.02]" 
                                : "text-text-secondary hover:text-text-primary hover:bg-secondary/20"
                        )}
                    >
                        Pendente
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentStatus('PAID')}
                        className={cn(
                            "py-4 rounded-[1.75rem] text-[11px] font-black transition-all uppercase tracking-widest active:scale-95",
                            paymentStatus === 'PAID' 
                                ? "bg-button-primary text-button-primary-foreground shadow-lg shadow-button-shadow scale-[1.02]" 
                                : "text-text-secondary hover:text-text-primary hover:bg-secondary/20"
                        )}
                    >
                        Pago
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
