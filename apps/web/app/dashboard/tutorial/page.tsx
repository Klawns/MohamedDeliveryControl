"use client";

import { motion } from "framer-motion";
import {
    Bike,
    Users,
    Settings,
    Smartphone,
    FileText,
    TrendingUp,
    ShieldCheck,
    MousePointer2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TutorialPage() {
    const steps = [
        {
            title: "Visão Mobile Otimizada",
            description: "No celular, você verá uma tela simplificada para registrar corridas em segundos enquanto está na rua.",
            icon: Smartphone,
            color: "text-blue-400",
            bg: "bg-blue-500/10"
        },
        {
            title: "Clientes em Grid 4x4",
            description: "Seus clientes aparecem como botões de atalho. Basta um toque para selecioná-los.",
            icon: Users,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Atalhos de Preço e Local",
            description: "Configure seus preços e destinos frequentes na página de Configurações para ganhar tempo.",
            icon: MousePointer2,
            color: "text-violet-400",
            bg: "bg-violet-500/10"
        },
        {
            title: "Relatórios em PDF",
            description: "Extraia comprovantes de faturamento diário, semanal ou mensal para seus clientes ou controle pessoal.",
            icon: FileText,
            color: "text-orange-400",
            bg: "bg-orange-500/10"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <header className="text-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 mb-2"
                >
                    <Bike size={32} />
                </motion.div>
                <h1 className="text-4xl font-black text-white tracking-tight">Bem-vindo ao Rotta!</h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Transformamos seu faturamento em algo simples, rápido e profissional.
                    Seja bem-vindo ao Rotta, o centro de comando do seu crescimento.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-8 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden"
                    >
                        <div className={cn("p-4 rounded-2xl w-fit mb-6", step.bg)}>
                            <step.icon size={24} className={step.color} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-slate-400 leading-relaxed">{step.description}</p>
                    </motion.div>
                ))}
            </div>

            <section className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-[2.5rem] p-10 text-center space-y-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white">Pronto para começar?</h2>
                    <p className="text-blue-100 mt-2 mb-8">Personalize seus botões de preço para sua região agora mesmo.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/dashboard/settings">
                            <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 font-bold px-8 h-14 rounded-2xl">
                                Configurar Atalhos <Settings className="ml-2" size={18} />
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold px-8 h-14 rounded-2xl">
                                Ir para o Painel
                            </Button>
                        </Link>
                    </div>
                </div>
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>
            </section>
        </div>
    );
}

import { cn } from "@/lib/utils";
