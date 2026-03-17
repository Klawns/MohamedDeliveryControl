"use client";

import { useState } from "react";
import { X, DollarSign, CheckCircle2 } from "lucide-react";
import { api } from "@/services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clientId: string;
    clientName: string;
}

export function PaymentModal({ isOpen, onClose, onSuccess, clientId, clientName }: PaymentModalProps) {
    const [amount, setAmount] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !amount) return;

        setIsSubmitting(true);
        try {
            await api.post(`/clients/${clientId}/payments`, {
                amount: Number(amount),
                notes: notes || undefined,
            });

            setAmount("");
            setNotes("");
            onSuccess();
            onClose();
        } catch (err) {
            alert("Erro ao registrar pagamento. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="bg-slate-900 border-white/10 p-0 overflow-hidden sm:rounded-[2.5rem] w-[calc(100%-2rem)] max-w-lg sm:max-w-[480px] gap-0 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Registrar Pagamento Parcial</DialogTitle>
                    <DialogDescription>
                        Informe o valor pago pelo cliente {clientName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 sm:right-10 sm:top-10 z-20 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all active:scale-95 group border border-white/5 shadow-lg"
                        title="Fechar"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="px-6 sm:px-10 pt-8 sm:pt-12 pb-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-400 font-black shadow-inner border border-emerald-500/10">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none">
                                    Registrar Pagamento
                                </h2>
                                <p className="text-slate-500 text-[10px] sm:text-xs mt-1.5 uppercase tracking-[0.2em] font-bold opacity-70">
                                    Pagamento Parcial / Antecipado
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3 bg-slate-950/30 p-4 rounded-2xl border border-white/5 mb-6">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Cliente</p>
                                <p className="text-white font-bold">{clientName}</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">
                                    Valor do Pagamento
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-base">R$</span>
                                    <input
                                        autoFocus
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xl font-black focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">
                                    Observações (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ex: Pagou em dinheiro, via Pix..."
                                    rows={3}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-slate-800 text-sm font-bold"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !amount}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                            >
                                {isSubmitting ? (
                                    <div className="h-6 w-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        CONFIRMAR PAGAMENTO
                                        <CheckCircle2 size={24} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
