"use client";

import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { api, apiClient } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Plan {
    id: string;
    name: string;
    price: number;
    interval?: string;
    description: string;
    features: string[];
    cta: string;
    highlight: boolean;
}

export function CheckoutSelector() {
    const { user } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadPlans() {
            try {
                const response = await apiClient.get<Plan[]>("/payments/plans");
                setPlans(response || []);
            } catch (error) {
                console.error("Erro ao carregar planos:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPlans();
    }, []);

    const formatPrice = (priceInCents: number) => {
        if (priceInCents === 0) return "Grátis";
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(priceInCents / 100);
    };

    const handlePlanSelect = (planId: string) => {
        if (planId === 'starter') {
            router.push('/dashboard');
            return;
        }

        router.push('/contato');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-lime-400 animate-spin" />
                <p className="mt-4 text-slate-400">Carregando planos disponíveis...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid lg:grid-cols-3 gap-8"
            >
                {plans.map((tier, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                            "p-10 rounded-3xl flex flex-col relative transition-all border",
                            tier.highlight
                                ? "bg-slate-900 border-lime-500/50 shadow-lime-500/5 shadow-2xl"
                                : "bg-slate-900/50 border-white/5 hover:border-white/10"
                        )}
                    >
                        {tier.highlight && (
                            <div className="absolute top-0 right-10 -translate-y-1/2 bg-lime-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                Mais Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-100 mb-2">{tier.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">{formatPrice(tier.price)}</span>
                                {tier.interval && <span className="text-slate-500 text-sm">{tier.interval}</span>}
                            </div>
                            <p className="mt-4 text-slate-400 leading-relaxed text-sm">{tier.description}</p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-grow">
                            {tier.features.map((feature, i) => (
                                <li key={i} className="flex gap-3 text-slate-300 text-sm items-center">
                                    <Check size={16} className="text-lime-500 shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handlePlanSelect(tier.id)}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold transition-all text-sm active:scale-[0.98]",
                                tier.highlight
                                    ? "bg-lime-500 hover:bg-lime-400 text-black shadow-lg shadow-lime-500/20"
                                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                            )}
                        >
                            {tier.cta}
                        </button>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
