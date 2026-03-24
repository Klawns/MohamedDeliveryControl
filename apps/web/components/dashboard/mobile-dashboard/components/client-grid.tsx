"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Star } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Client } from "@/types/rides";

import { ClientGridSkeleton } from "./client-grid-skeleton";
import { DashboardClientGridContainer } from "@/components/ui/dashboard-client-grid-container";

interface ClientGridProps {
    clients: Client[];
    selectedClient: Client | null;
    onSelect: (client: Client | null) => void;
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    error: any;
    retry: () => void;
    openCreateModal: () => void;
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (open: boolean) => void;
    newClientName: string;
    setNewClientName: (name: string) => void;
    isCreating: boolean;
    onCreate: () => void;
}


export function ClientGrid({
    clients,
    selectedClient,
    onSelect,
    isLoading,
    hasMore,
    onLoadMore,
    error,
    retry,
    openCreateModal,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newClientName,
    setNewClientName,
    isCreating,
    onCreate
}: ClientGridProps) {
    const gridItems = useMemo(() => [
        ...clients.filter(Boolean),
        { isNewButton: true } as any
    ], [clients]);

    return (
        <section className={cn(
            "bg-card-background border border-border-subtle p-4 rounded-3xl shadow-sm flex flex-col overflow-hidden transition-all duration-300",
            !selectedClient ? "min-h-[300px]" : "min-h-[100px]"
        )}>
            <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
                <h2 className="text-lg font-display font-extrabold text-text-primary flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    {selectedClient ? "Cliente" : "Selecione o Cliente"}
                </h2>
                {selectedClient && (
                    <button
                        onClick={() => onSelect(null)}
                        className="text-xs text-primary font-medium hover:underline"
                    >
                        Trocar
                    </button>
                )}
            </div>

            {!selectedClient ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoading && clients.length === 0 ? (
                        <ClientGridSkeleton />
                    ) : (
                        <DashboardClientGridContainer
                            items={gridItems}
                            maxHeight="40vh"
                            gap={12}
                            hasMore={hasMore}
                            isLoading={isLoading}
                            onLoadMore={onLoadMore}
                            renderItem={(row) => (
                                <div className="grid grid-cols-3 gap-3 w-full">
                                    {row.map((item: any) => {
                                        if ('isNewButton' in item) {
                                            return (
                                                <button
                                                    key="new-button"
                                                    onClick={openCreateModal}
                                                    className="aspect-square border border-dashed border-primary/30 bg-primary/5 rounded-2xl flex flex-col items-center justify-center p-3 group active:bg-primary/10 transition-all active:scale-95"
                                                >
                                                    <div className="w-8 h-8 rounded-full border border-dashed border-primary/40 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-primary">
                                                        <Plus size={14} />
                                                    </div>
                                                    <span className="text-[10px] text-primary font-display font-bold uppercase tracking-wider">Novo</span>
                                                </button>
                                            );
                                        }

                                        const client = item as Client;
                                        const isSelected = !!selectedClient && (selectedClient as any).id === client.id;

                                        return (
                                            <motion.button
                                                key={client.id}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onSelect(client)}
                                                className={cn(
                                                    "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all relative group overflow-hidden",
                                                    isSelected 
                                                        ? "bg-primary/20 border-primary/50 ring-1 ring-primary/20" 
                                                        : "bg-muted/50 border-border-subtle border active:bg-hover-accent"
                                                )}
                                            >

                                                {client.isPinned && (
                                                    <div className="absolute top-2 right-2 text-amber-500 animate-pulse">
                                                        <Star size={10} className="fill-amber-500" />
                                                    </div>
                                                )}

                                                <span className={cn(
                                                    "text-[16px] font-bold leading-[1.1] w-full text-center break-words px-2 line-clamp-2 transition-colors",
                                                    isSelected ? "text-foreground" : "text-foreground/90 group-active:text-foreground"
                                                )}>
                                                    {client.name || "Sem nome"}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        />
                    )}
                </div>
            ) : (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg shadow-primary/5">
                    <div>
                        <h3 className="font-display font-extrabold text-text-primary text-xl leading-tight uppercase tracking-tighter">{selectedClient.name || "Sem nome"}</h3>
                        <p className="text-[10px] font-display font-bold text-primary mt-1 uppercase tracking-widest opacity-80">Cliente selecionado</p>
                    </div>
                    <div className="bg-primary/20 p-2 rounded-xl">
                        <Users size={20} className="text-primary" />
                    </div>
                </div>
            )}

            {/* In-Page Modal for client creation */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-sm bg-card border border-border rounded-[2rem] p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-foreground mb-4">Novo Cliente</h3>
                            <input
                                autoFocus
                                value={newClientName}
                                onChange={e => setNewClientName(e.target.value)}
                                placeholder="Nome do cliente..."
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary mb-4"
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 text-muted-foreground"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={onCreate}
                                    disabled={!newClientName || isCreating}
                                    className="flex-1 bg-primary text-primary-foreground font-bold"
                                >
                                    {isCreating ? "Criando..." : "Cadastrar"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
