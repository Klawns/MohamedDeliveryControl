"use client";

import { motion } from "framer-motion";
import { DollarSign, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { PaymentStatus } from "@/types/rides";
import { PaymentComposition } from "@/components/ui/payment-composition";
import { RideFinancialImpactNotice } from "../ride-financial-impact-notice";

interface StepPaymentStatusProps {
    paymentStatus: PaymentStatus;
    setPaymentStatus: (status: PaymentStatus) => void;
    useBalance: boolean;
    setUseBalance: (use: boolean) => void;
    availableBalance: number;
    rideValue: number;
    paidWithBalance: number;
    debtValue: number;
    willReopenDebtOnSave?: boolean;
    projectedDebtValue?: number;
}

export function StepPaymentStatus({
    paymentStatus,
    setPaymentStatus,
    useBalance,
    setUseBalance,
    availableBalance,
    rideValue,
    paidWithBalance,
    debtValue,
    willReopenDebtOnSave = false,
    projectedDebtValue = debtValue,
}: StepPaymentStatusProps) {
    const remainingBalanceAfterRide = availableBalance - paidWithBalance;

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
                        disabled={useBalance && debtValue === 0}
                        className={cn(
                            "py-4 rounded-[1.75rem] text-[11px] font-black transition-all uppercase tracking-widest active:scale-95",
                            paymentStatus === 'PENDING' 
                                ? "bg-warning text-white shadow-lg shadow-warning/20 scale-[1.02]" 
                                : "text-text-secondary hover:text-text-primary hover:bg-secondary/20",
                            useBalance && debtValue === 0 && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        Pendente
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentStatus('PAID')}
                        disabled={willReopenDebtOnSave}
                        className={cn(
                            "py-4 rounded-[1.75rem] text-[11px] font-black transition-all uppercase tracking-widest active:scale-95",
                            paymentStatus === 'PAID' 
                                ? "bg-button-primary text-button-primary-foreground shadow-lg shadow-button-shadow scale-[1.02]" 
                                : "text-text-secondary hover:text-text-primary hover:bg-secondary/20",
                            willReopenDebtOnSave && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        Pago
                    </button>
                </div>
            </div>

            {willReopenDebtOnSave ? (
                <RideFinancialImpactNotice debtValue={projectedDebtValue} />
            ) : null}

            {availableBalance > 0 && (
                <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                        <Wallet size={12} /> Saldo do Cliente
                    </label>
                    <button
                        type="button"
                        onClick={() => setUseBalance(!useBalance)}
                        className={cn(
                            "w-full p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 active:scale-[0.98] group",
                            useBalance 
                                ? "bg-success/5 border-success shadow-lg shadow-success/10" 
                                : "bg-secondary/5 border-border-subtle hover:border-secondary/30 hover:bg-secondary/10"
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                            useBalance ? "bg-success text-success-foreground scale-110 shadow-lg" : "bg-secondary/20 text-text-secondary group-hover:scale-110"
                        )}>
                            <Wallet size={24} />
                        </div>
                        <div className="text-center">
                            <p className={cn(
                                "text-[11px] font-black uppercase tracking-widest transition-colors",
                                useBalance ? "text-success" : "text-text-secondary"
                            )}>
                                Usar Saldo Disponível
                            </p>
                            <p className="text-xl font-display font-black text-text-primary mt-1">
                                {formatCurrency(availableBalance)}
                            </p>
                        </div>
                    </button>

                    {useBalance && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card/50 border border-border-subtle rounded-[2rem] p-8 flex flex-col items-center gap-2 mt-2"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">Resumo do Pagamento</span>
                            <PaymentComposition 
                                size="lg" 
                                align="center"
                                totalValue={rideValue}
                                paidWithBalance={paidWithBalance}
                                debtValue={debtValue}
                                showLabel={true}
                            />

                            {remainingBalanceAfterRide > 0 && (
                                <div className="mt-4 pt-4 border-t border-border-subtle w-full text-center">
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                        Saldo restante após corrida
                                    </p>
                                    <p className="text-lg font-black text-icon-success mt-1">
                                        {formatCurrency(remainingBalanceAfterRide)}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
