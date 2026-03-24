"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CreditCard, Phone, User as UserIcon, ShieldCheck, ArrowRight } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { api, apiClient } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const taxDataSchema = z.object({
    taxId: z.string().min(14, "CPF inválido").max(14, "CPF inválido"),
    cellphone: z.string().min(14, "Telefone inválido"),
});

type TaxDataValues = z.infer<typeof taxDataSchema>;

function TaxDataModal({ 
    isOpen, 
    onOpenChange, 
    onSubmit, 
    isLoading 
}: { 
    isOpen: boolean; 
    onOpenChange: (open: boolean) => void; 
    onSubmit: (data: TaxDataValues) => void;
    isLoading: boolean;
}) {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<TaxDataValues>({
        resolver: zodResolver(taxDataSchema),
        defaultValues: {
            taxId: "",
            cellphone: "",
        }
    });

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})/, "$1-$2")
            .replace(/(-\d{2})\d+?$/, "$1");
    };

    const formatPhone = (value: string) => {
        return value
            .replace(/\D/g, "")
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .replace(/(-\d{4})\d+?$/, "$1");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-slate-950 border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
                <div className="relative p-8 pt-10">
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
                    
                    <DialogHeader className="relative space-y-4 mb-8">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black text-white tracking-tight">Dados de Faturamento</DialogTitle>
                            <DialogDescription className="text-slate-400 text-base">
                                Precisamos de mais algumas informações para processar sua assinatura com segurança.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="taxId" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">CPF</Label>
                                <div className="relative">
                                    <Input
                                        id="taxId"
                                        placeholder="000.000.000-00"
                                        {...register("taxId")}
                                        onChange={(e) => setValue("taxId", formatCPF(e.target.value))}
                                        className={cn(
                                            "bg-white/5 border-white/10 h-14 rounded-2xl pl-4 text-white placeholder:text-slate-600 transition-all focus:ring-2 focus:ring-blue-500/40",
                                            errors.taxId && "border-red-500/50 bg-red-500/5"
                                        )}
                                    />
                                </div>
                                {errors.taxId && <p className="text-red-400 text-[10px] font-black uppercase tracking-wider ml-1">{errors.taxId.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cellphone" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Telefone WhatsApp</Label>
                                <div className="relative">
                                    <Input
                                        id="cellphone"
                                        placeholder="(00) 00000-0000"
                                        {...register("cellphone")}
                                        onChange={(e) => setValue("cellphone", formatPhone(e.target.value))}
                                        className={cn(
                                            "bg-white/5 border-white/10 h-14 rounded-2xl pl-4 text-white placeholder:text-slate-600 transition-all focus:ring-2 focus:ring-blue-500/40",
                                            errors.cellphone && "border-red-500/50 bg-red-500/5"
                                        )}
                                    />
                                </div>
                                {errors.cellphone && <p className="text-red-400 text-[10px] font-black uppercase tracking-wider ml-1">{errors.cellphone.message}</p>}
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white h-16 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] shadow-2xl shadow-blue-500/20 group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-3">
                                    Continuar para Pagamento
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>

                        <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
                            Seus dados estão protegidos por criptografia de ponta a ponta
                        </p>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CheckoutContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const planId = searchParams.get("plan");
    const couponCode = searchParams.get("coupon") || "";

    const [plans, setPlans] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [showTaxModal, setShowTaxModal] = useState(false);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const response = await apiClient.get<any[]>("/payments/plans");
                setPlans(response || []);
            } catch (err) {
                console.error("Erro ao carregar planos:", err);
            } finally {
                setIsLoadingPlans(false);
            }
        };
        loadPlans();
    }, []);

    const selectedPlan = plans.find(p => p.id === planId);

    const handleCheckoutInit = () => {
        if (!planId || planId === "starter") {
            router.push("/dashboard");
            return;
        }
        setShowTaxModal(true);
    };

    const handleTaxDataSubmit = async (data: TaxDataValues) => {
        setIsCreatingCheckout(true);
        try {
            // TEMPORARILY BLOCKED per user request: "bloqueasse a parte de ir para o checkout de qualquer um dos sistemas de pagamento por enquanto"
            console.log("Checkout bloqueado temporariamente:", data);
            
            // Simular um atraso para mostrar o carregamento
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Redirecionar para contato como solicitado
            router.push("/contato");
            
            /* 
            // CÓDIGO ORIGINAL BLOQUEADO:
            const data = await apiClient.post<any>("/payments/checkout", {
                plan: planId,
                couponCode: couponCode || undefined,
                taxId: data.taxId.replace(/\D/g, ""),
                cellphone: data.cellphone.replace(/\D/g, ""),
            });
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError("Não foi possível gerar o link de pagamento.");
                setIsCreatingCheckout(false);
            }
            */
        } catch (err: any) {
            console.error("Erro ao criar checkout:", err);
            setError("Ocorreu um erro ao processar seu pedido. Tente novamente em instantes.");
            setIsCreatingCheckout(false);
        }
    };

    useEffect(() => {
        if (!user || isLoadingPlans || showTaxModal || isCreatingCheckout || error) return;
        handleCheckoutInit();
    }, [user, planId, isLoadingPlans, error, showTaxModal]);

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full text-center space-y-8 relative z-10">
                {!error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto relative" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                {selectedPlan ? `Assinando ${selectedPlan.name}` : 'Preparando checkout...'}
                            </h1>
                            <p className="text-slate-400 text-lg">
                                {selectedPlan
                                    ? `Total: ${formatCurrency(selectedPlan.price / 100)}${selectedPlan.interval || ''}`
                                    : "Aguarde um momento..."
                                }
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm shadow-2xl">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {isCreatingCheckout 
                                    ? "Finalizando sua solicitação..." 
                                    : "Aguarde enquanto preparamos seus dados para uma transação 100% segura."}
                            </p>
                        </div>

                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                            Ambiente Criptografado & Seguro
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/5 border border-red-500/20 p-10 rounded-[2.5rem] space-y-6 backdrop-blur-xl shadow-2xl"
                    >
                        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                            <span className="text-red-500 text-2xl font-bold">!</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-white">Ops! Tivemos um problema</h1>
                            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setError("");
                                    setShowTaxModal(true);
                                }}
                                className="w-full bg-white text-black h-14 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5"
                            >
                                Tentar Novamente
                            </button>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="w-full text-slate-500 hover:text-white text-sm font-medium transition-colors"
                            >
                                Ir para o Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <TaxDataModal 
                isOpen={showTaxModal} 
                onOpenChange={setShowTaxModal}
                onSubmit={handleTaxDataSubmit}
                isLoading={isCreatingCheckout}
            />
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
