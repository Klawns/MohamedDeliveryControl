"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function FinanceCard() {
    return (
        <Link href="/dashboard/finance" className="block outline-none h-full">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 rounded-[2.5rem] border border-border-subtle bg-gradient-to-br from-icon-info/10 to-icon-brand/10 relative overflow-hidden group hover:from-icon-info/20 transition-all cursor-pointer h-full shadow-sm hover:shadow-md active:scale-[0.99]"
            >
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">Relatórios Financeiros</h2>
                    <p className="text-text-secondary mt-2 max-w-[80%] font-medium">Analise suas métricas detalhadas e exporte relatórios em PDF/Excel.</p>
                    <div className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-button-primary text-button-primary-foreground font-black rounded-xl group-hover:scale-105 transition-all shadow-lg shadow-button-shadow uppercase text-xs tracking-widest">
                        Acessar agora
                    </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-icon-info/20 blur-[60px] rounded-full transition-colors group-hover:bg-icon-info/30"></div>
            </motion.div>
        </Link>
    );
}
