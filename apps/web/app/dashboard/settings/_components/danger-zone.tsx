"use client";

import { useState } from "react";
import { ShieldAlert, Trash2, Users, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBulkDelete } from "../_hooks/use-bulk-delete";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { Progress } from "@/components/ui/progress";

export function DangerZone() {
    const { 
        deleteAllClients, 
        isDeletingClients, 
        clientsProgress,
        deleteAllRides, 
        isDeletingRides,
        ridesProgress 
    } = useBulkDelete();
    
    const [isConfirmClientsOpen, setIsConfirmClientsOpen] = useState(false);
    const [isConfirmRidesOpen, setIsConfirmRidesOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="space-y-2">
                <h3 className="text-2xl font-display font-extrabold text-destructive tracking-tight flex items-center gap-2">
                    <ShieldAlert size={24} />
                    Zona de Perigo
                </h3>
                <p className="text-sm text-text-muted font-medium">Ações irreversíveis para gerenciar seus dados de forma definitiva.</p>
            </div>

            <div className="grid gap-6">
                {/* Delete All Clients */}
                <div className="p-8 bg-card-background border border-destructive/10 rounded-[2.5rem] flex flex-col gap-6 transition-all hover:border-destructive/30 group relative overflow-hidden">
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                        <div className="space-y-3 relative z-10 text-center md:text-left">
                            <h4 className="text-xl font-display font-black text-text-primary uppercase tracking-tight">Excluir todos os clientes</h4>
                            <p className="text-text-secondary text-sm font-medium max-w-md leading-relaxed">
                                Isso removerá permanentemente todos os dados de clientes cadastrados. <span className="text-destructive font-bold underline">Esta ação não pode ser desfeita.</span>
                            </p>
                            
                            <div className="flex items-start gap-2 p-3 bg-destructive/5 rounded-xl border border-destructive/10 max-w-md">
                                <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
                                <p className="text-[11px] text-destructive/80 font-bold leading-tight uppercase tracking-wide">
                                    Aviso: Ao excluir clientes, todas as corridas e pagamentos vinculados a eles também serão apagados permanentemente.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setIsConfirmClientsOpen(true)}
                            disabled={isDeletingClients}
                            className="bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground font-display font-black px-8 h-14 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px] w-full md:w-auto min-w-[200px] relative z-20"
                        >
                            {isDeletingClients ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} strokeWidth={3} />}
                            {isDeletingClients ? "EXCLUINDO..." : "EXCLUIR TUDO"}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {isDeletingClients && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 relative z-10"
                            >
                                <div className="flex justify-between items-center text-[10px] font-display font-black text-destructive uppercase tracking-widest">
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={12} />
                                        Processando exclusão em massa...
                                    </span>
                                    <span>{clientsProgress}%</span>
                                </div>
                                <Progress value={clientsProgress} className="h-2 bg-destructive/10 transition-all" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Delete All Rides */}
                <div className="p-8 bg-card-background border border-destructive/10 rounded-[2.5rem] flex flex-col gap-6 transition-all hover:border-destructive/30 group relative overflow-hidden">

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                        <div className="space-y-3 relative z-10 text-center md:text-left">
                            <h4 className="text-xl font-display font-black text-text-primary uppercase tracking-tight">Limpar histórico de corridas</h4>
                            <p className="text-text-secondary text-sm font-medium max-w-md leading-relaxed">
                                Todos os registros de corridas e estatísticas serão apagados definitivamente. <span className="text-destructive font-bold underline">Ação irreversível.</span>
                            </p>
                        </div>

                        <Button
                            onClick={() => setIsConfirmRidesOpen(true)}
                            disabled={isDeletingRides}
                            className="bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground font-display font-black px-8 h-14 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px] w-full md:w-auto min-w-[200px] relative z-20"
                        >
                            {isDeletingRides ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} strokeWidth={3} />}
                            {isDeletingRides ? "LIMPANDO..." : "LIMPAR TUDO"}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {isDeletingRides && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3 relative z-10"
                            >
                                <div className="flex justify-between items-center text-[10px] font-display font-black text-destructive uppercase tracking-widest">
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={12} />
                                        Resetando histórico de atividades...
                                    </span>
                                    <span>{ridesProgress}%</span>
                                </div>
                                <Progress value={ridesProgress} className="h-2 bg-destructive/10 transition-all" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="p-6 bg-destructive/5 border border-dashed border-destructive/20 rounded-3xl">
                <p className="text-[12px] text-destructive font-display font-black uppercase tracking-widest text-center opacity-70">
                    Cuidado: As ações acima são permanentes e não podem ser recuperadas após a confirmação.
                </p>
            </div>

            {/* Confirmations */}
            <ConfirmModal
                isOpen={isConfirmClientsOpen}
                onClose={() => setIsConfirmClientsOpen(false)}
                onConfirm={async () => {
                    await deleteAllClients();
                    setIsConfirmClientsOpen(false);
                }}
                title="Excluir todos os clientes?"
                description="Tem certeza absoluta que deseja excluir todos os clientes? Esta ação removerá permanentemente todos os registros de clientes, corridas e pagamentos do sistema."
                confirmText="Sim, excluir tudo"
                variant="danger"
                isLoading={isDeletingClients}
            />

            <ConfirmModal
                isOpen={isConfirmRidesOpen}
                onClose={() => setIsConfirmRidesOpen(false)}
                onConfirm={async () => {
                    await deleteAllRides();
                    setIsConfirmRidesOpen(false);
                }}
                title="Limpar histórico?"
                description="Deseja realmente apagar todo o histórico de corridas? Suas estatísticas e registros serão resetados permanentemente."
                confirmText="Sim, limpar histórico"
                variant="danger"
                isLoading={isDeletingRides}
            />
        </motion.div>
    );
}
