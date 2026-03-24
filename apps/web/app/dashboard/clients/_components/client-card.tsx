import React from "react";
import { motion } from "framer-motion";
import { User, Star, Bike, ChevronRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client } from "@/types/rides";

interface ClientCardProps {
    client: Client;
    onEdit: (client: Client) => void;
    onPin: (client: Client) => void;
    onQuickRide: (client: Client) => void;
    onViewHistory: (client: Client) => void;
}

export const ClientCard = React.memo(({ client, onEdit, onPin, onQuickRide, onViewHistory }: ClientCardProps) => {
    return (
        <motion.div
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onViewHistory(client)}
            className="p-5 rounded-[2.5rem] border border-border-subtle bg-card-background hover:bg-hover-accent transition-all cursor-pointer group relative overflow-hidden active:scale-[0.98] shadow-sm hover:shadow-md"
        >
            <div className="flex flex-col gap-5 relative z-10">
                <div className="flex items-start gap-4">
                    {/* Icone do Cliente - Maior e Azul */}
                    <div className="flex-shrink-0 w-14 h-14 bg-icon-info/10 border border-icon-info/10 rounded-2xl flex items-center justify-center text-icon-info shadow-sm group-hover:bg-icon-info/20 transition-colors">
                        <User size={28} />
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-text-primary text-xl leading-tight break-all line-clamp-2 flex-1 tracking-tight">
                                {client?.name ? client.name : "Sem nome"}
                            </h3>
                            {client.isPinned && (
                                <Star size={14} className="fill-icon-warning text-icon-warning shrink-0" />
                            )}
                        </div>
                        <p className="text-xs text-text-secondary font-bold uppercase tracking-widest opacity-70">Perfil do Cliente</p>
                    </div>
                </div>

                {/* Barra de Ações Inferior */}
                <div className="flex items-center justify-between bg-muted/50 p-2 pr-4 rounded-2xl border border-border-subtle shadow-inner">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPin(client);
                            }}
                            className={cn(
                                "h-11 w-11 flex items-center justify-center rounded-xl transition-all active:scale-90 border",
                                client.isPinned
                                    ? "bg-icon-warning/20 text-icon-warning border-icon-warning/20 shadow-sm"
                                    : "bg-secondary/10 text-text-secondary hover:text-text-primary border-border-subtle"
                            )}
                            title={client.isPinned ? "Desafixar" : "Fixar"}
                        >
                            <Star size={20} className={cn(client.isPinned && "fill-icon-warning")} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(client);
                            }}
                            className="h-11 w-11 flex items-center justify-center bg-muted/50 text-text-secondary hover:text-text-primary border border-border-subtle rounded-xl transition-all active:scale-90"
                            title="Editar Dados"
                        >
                            <Settings2 size={20} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuickRide(client);
                            }}
                            className="h-11 w-11 flex items-center justify-center bg-button-primary border border-button-primary rounded-xl text-button-primary-foreground transition-all active:scale-90 shadow-lg shadow-button-shadow"
                            title="Nova Corrida Rápida"
                        >
                            <Bike size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-text-secondary group-hover:text-text-primary transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">Detalhes</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Efeito Visual de Fundo */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-icon-info/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
});

ClientCard.displayName = "ClientCard";
