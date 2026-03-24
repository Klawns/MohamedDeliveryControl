"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, User, ArrowRight } from "lucide-react";
import { FrequentClient } from "@/types/rides";

interface FrequentClientsProps {
    clients: FrequentClient[];
    isLoading: boolean;
    onSelectClient: (id: string, name: string) => void;
}

export function FrequentClients({ clients, isLoading, onSelectClient }: FrequentClientsProps) {
    return (
        <AnimatePresence>
            {!isLoading && clients.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 px-1">
                        <Star size={14} className="text-primary fill-primary" />
                        <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Clientes Fixados</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {clients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => onSelectClient(client.id, client.name)}
                                className="bg-card-background border border-border-subtle hover:bg-hover-accent hover:border-border px-5 py-3 rounded-2xl flex items-center gap-3 transition-all group active:scale-95 text-left"
                            >
                                <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <User size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-primary leading-tight truncate">{client.name}</p>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">Fixado</p>
                                </div>
                                <ArrowRight size={14} className="text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    );
}
