"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Plus, X, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client } from "@/types/rides";
import { DashboardClientGridContainer } from "@/components/ui/dashboard-client-grid-container";

interface StepClientSelectionProps {
    clients: Client[];
    selectedClientId: string;
    setSelectedClientId: (id: string) => void;
    onNext: () => void;
    isCreatingClient: boolean;
    setIsCreatingClient: (val: boolean) => void;
    newClientName: string;
    setNewClientName: (name: string) => void;
    handleCreateClient: () => Promise<void>;
    isLoadingData: boolean;
}

export function StepClientSelection({
    clients,
    selectedClientId,
    setSelectedClientId,
    onNext,
    isCreatingClient,
    setIsCreatingClient,
    newClientName,
    setNewClientName,
    handleCreateClient,
    isLoadingData
}: StepClientSelectionProps) {
    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 flex-1 flex flex-col min-h-0"
        >
            <div className="flex items-center justify-between flex-shrink-0">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                    <User size={12} /> Selecionar Cliente
                </label>
                <span className="text-[10px] text-text-secondary font-bold">{clients.length} cadastrados</span>
            </div>

            <DashboardClientGridContainer
                items={[
                    ...[...clients.filter(Boolean)].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1)),
                    { isNewButton: true } as any
                ]}
                maxHeight="40vh"
                gap={16}
                isLoading={isLoadingData}
                renderItem={(row) => (
                    <div className="grid grid-cols-3 gap-4 w-full">
                        {row.map((item: any) => {
                            if ('isNewButton' in item) {
                                return (
                                    <button
                                        key="new-button"
                                        type="button"
                                        onClick={() => setIsCreatingClient(true)}
                                        className="aspect-square border border-dashed border-icon-info/30 bg-icon-info/5 rounded-2xl flex flex-col items-center justify-center p-2 group active:bg-icon-info/10 transition-colors"
                                    >
                                        <Plus size={20} className="text-icon-info group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] text-icon-info mt-1 font-bold uppercase tracking-tighter">Novo</span>
                                    </button>
                                );
                            }

                            const client = item as Client;
                            const isSelected = selectedClientId === client.id;

                            return (
                                <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedClientId(client.id);
                                        onNext();
                                    }}
                                    className={cn(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all active:scale-95 border relative group shadow-sm",
                                        isSelected
                                            ? "bg-button-primary border-button-primary text-button-primary-foreground shadow-button-shadow"
                                            : "bg-secondary/10 border-border-subtle hover:bg-secondary/20"
                                    )}
                                >
                                    <div className="absolute top-2 left-2">
                                        <Users 
                                            size={14} 
                                            className={cn(
                                                isSelected ? "text-button-primary-foreground/40 fill-button-primary-foreground/20" : "text-icon-info fill-icon-info/20"
                                            )} 
                                        />
                                    </div>

                                    {client.isPinned && (
                                        <div className={cn(
                                            "absolute top-2 right-2",
                                            isSelected ? "text-button-primary-foreground" : "text-icon-warning"
                                        )}>
                                            <Star size={10} className={isSelected ? "fill-button-primary-foreground/50" : "fill-icon-warning"} />
                                        </div>
                                    )}

                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tighter leading-tight px-1 break-all line-clamp-2",
                                        isSelected ? "text-button-primary-foreground" : "text-icon-info group-hover:text-icon-info-hover"
                                    )}>
                                        {client.name || "Sem nome"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            />

            <AnimatePresence>
                {isCreatingClient && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed inset-x-0 bottom-0 z-[160] p-6 bg-modal-background border-t border-border-subtle rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-display font-extrabold text-text-primary tracking-tight">Novo Cliente</h3>
                            <button
                                type="button"
                                onClick={() => setIsCreatingClient(false)}
                                className="text-text-secondary hover:text-text-primary p-1 bg-secondary/10 hover:bg-secondary/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input
                                autoFocus
                                value={newClientName}
                                onChange={e => setNewClientName(e.target.value)}
                                placeholder="Nome Completo..."
                                className="w-full bg-secondary/10 border border-border-subtle rounded-2xl py-4 px-6 text-text-primary font-bold outline-none focus:border-icon-info transition-all placeholder:text-text-secondary/50"
                            />
                            <button
                                type="button"
                                onClick={handleCreateClient}
                                disabled={!newClientName || isLoadingData}
                                 className="w-full bg-button-primary hover:bg-button-primary-hover text-button-primary-foreground font-bold py-4 rounded-2xl shadow-lg shadow-button-shadow active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
                            >
                                {isLoadingData ? "CADASTRANDO..." : "CADASTRAR E CONTINUAR"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
