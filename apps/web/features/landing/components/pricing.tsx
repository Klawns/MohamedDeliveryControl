"use client";

import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { api, apiClient } from "@/services/api";

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

export function Pricing() {
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

    if (isLoading) {
        return (
            <section id="pricing" className="py-24 px-6">
                <div className="container mx-auto text-center">
                    <p className="text-slate-400">Carregando planos...</p>
                </div>
            </section>
        );
    }

    if (plans.length === 0) return null;

    return (
        <section id="pricing" className="py-32 px-6 relative overflow-hidden bg-[#020617]">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[140px] rounded-full -z-10" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full -z-10" />

            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center [mask-image:radial-gradient(white,transparent_85%)] opacity-10 pointer-events-none" />

            <div className="container mx-auto relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight text-white">
                        Escolha seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 glow-text">plano</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                        O investimento ideal para quem deseja profissionalizar sua logística.
                        Comece sem custos e escale seu controle conforme seu sucesso aumenta.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 max-w-7xl mx-auto items-stretch">
                    {plans.map((tier, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{
                                duration: 0.8,
                                delay: idx * 0.1,
                                ease: [0.21, 1.02, 0.47, 0.98]
                            }}
                            whileHover={{
                                y: -12,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            className="relative group h-full flex"
                        >
                            {/* Card Glow Background */}
                            <div className={cn(
                                "absolute -inset-[2px] rounded-[2.5rem] opacity-0 group-hover:opacity-40 blur-[4px] transition-all duration-500 pointer-events-none z-0",
                                tier.highlight ? "bg-blue-500" : "bg-slate-400"
                            )} />

                            <div className={cn(
                                "flex flex-col relative w-full p-10 rounded-[2.5rem] border transition-all duration-500 z-10",
                                tier.highlight
                                    ? "bg-slate-900/90 backdrop-blur-xl border-blue-500/40 shadow-[0_30px_60px_-15px_rgba(59,130,246,0.3)] lg:scale-105"
                                    : "bg-slate-900/40 backdrop-blur-md border-white/10 group-hover:bg-slate-900/60 group-hover:border-white/20"
                            )}>
                                {tier.highlight && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-8 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-2xl ring-4 ring-blue-600/10">
                                        RECOMENDADO
                                    </div>
                                )}

                                <div className="mb-10">
                                    <h3 className="text-sm font-black text-blue-400 mb-4 uppercase tracking-[0.3em]">{tier.name}</h3>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-6xl font-black text-white tracking-tighter">{formatPrice(tier.price)}</span>
                                            {tier.interval && <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">{tier.interval}</span>}
                                        </div>
                                        <p className="mt-6 text-slate-400 leading-relaxed text-sm font-medium pr-4">{tier.description}</p>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

                                <ul className="space-y-5 mb-12 flex-grow">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex gap-4 text-slate-300 text-sm items-start group/item">
                                            <div className={cn(
                                                "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                                tier.highlight ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-500 group-hover/item:text-blue-400"
                                            )}>
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                            <span className="font-medium pt-0.5 leading-tight group-hover/item:text-white transition-colors">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                onClick={() => {
                                    router.push("/contato");
                                }}
                                    className={cn(
                                        "w-full py-5 rounded-2xl font-black transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98] shadow-2xl relative overflow-hidden group/btn",
                                        tier.highlight
                                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                                            : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                    )}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {tier.cta}
                                        <ArrowRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform" />
                                    </span>
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
