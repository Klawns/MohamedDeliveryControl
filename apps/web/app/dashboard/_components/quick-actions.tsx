"use client";

import { motion } from "framer-motion";
import { Users, Bike } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-[2.5rem] border border-border bg-card/40 h-full"
        >
            <h2 className="text-xl font-bold text-foreground mb-6">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-4">
                <Link href="/dashboard/clients" className="p-6 rounded-[2rem] bg-accent/50 border border-border hover:bg-accent transition-all text-left group">
                    <Users className="text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <span className="block font-semibold">Novo Cliente</span>
                </Link>
                <Link href="/dashboard/rides" className="p-6 rounded-[2rem] bg-accent/50 border border-border hover:bg-accent transition-all text-left group">
                    <Bike className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="block font-semibold">Registrar Corrida</span>
                </Link>
            </div>
        </motion.div>
    );
}
