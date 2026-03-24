import React from "react";
import { motion } from "framer-motion";
import { Bike, User, Clock, Calendar, MessageSquare, Trash2, ChevronRight, Settings2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Ride } from "@/types/rides";

interface RideCardProps {
    ride: Ride;
    index: number;
    onEdit: (ride: Ride) => void;
    onDelete: (ride: Ride) => void;
    onTogglePayment: (ride: Ride) => void;
}

export const RideCard = React.memo(({ ride, index, onEdit, onDelete, onTogglePayment }: RideCardProps) => {
    return (
        <motion.div
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onEdit(ride)}
            className="p-4 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] border border-border-subtle bg-card-background hover:bg-hover-accent transition-all group flex flex-col gap-4 sm:gap-6 cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md"
        >
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-icon-info/10 border border-icon-info/10 rounded-xl sm:rounded-2xl text-icon-info group-hover:scale-110 transition-transform flex-shrink-0 shadow-sm">
                    <Bike size={24} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between sm:justify-start gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-display font-extrabold text-text-primary text-base sm:text-lg truncate tracking-tight">Corrida #{ride.id.split("-")[0]}</h4>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePayment(ride);
                                }}
                                className={cn(
                                    "hidden sm:inline-block text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full flex-shrink-0 border transition-all active:scale-95",
                                    ride.paymentStatus === 'PAID' 
                                        ? "bg-icon-success/10 text-icon-success border-icon-success/20" 
                                        : "bg-icon-warning/10 text-icon-warning border-icon-warning/20"
                                )}
                            >
                                {ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                            </button>
                        </div>
                        
                        {/* Mobile Price & Status Stack */}
                        <div className="sm:hidden flex flex-col items-end gap-1.5 shrink-0">
                            <p className="text-lg font-display font-extrabold text-text-primary leading-none tracking-tighter">{formatCurrency(ride.value)}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePayment(ride);
                                }}
                                className={cn(
                                    "text-[8px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border",
                                    ride.paymentStatus === 'PAID' 
                                        ? "bg-icon-success/10 text-icon-success border-icon-success/20" 
                                        : "bg-icon-warning/10 text-icon-warning border-icon-warning/20"
                                )}
                            >
                                {ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-text-secondary block mb-0.5 uppercase tracking-widest opacity-70">Cliente</span>
                        <span className="text-lg font-display font-extrabold text-text-primary block tracking-tight break-words line-clamp-1 group-hover:text-primary transition-colors pr-2">
                            {ride.clientName || "Passageiro"}
                        </span>
                    </div>
                </div>

                {/* Desktop Price */}
                <div className="hidden sm:flex text-right flex-col items-end shrink-0 outline-none">
                    <p className="text-2xl font-display font-extrabold text-text-primary leading-none tracking-tighter">{formatCurrency(ride.value)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pt-4 border-t border-border-subtle">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-text-secondary text-[10px] font-bold uppercase tracking-widest">
                        <Calendar size={14} className="text-icon-info/50" />
                        {new Date(ride.rideDate || ride.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-[10px] font-bold uppercase tracking-widest border-l border-border-subtle pl-3 ml-1">
                        <Clock size={14} className="text-icon-info/50" />
                        {new Date(ride.rideDate || ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {ride.notes && (
                        <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-xl border border-border-subtle shadow-inner max-w-[150px] sm:max-w-none">
                            <MessageSquare size={14} className="text-text-secondary opacity-50 flex-shrink-0" />
                            <p className="text-[10px] text-text-secondary italic font-medium truncate">"{ride.notes}"</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-start sm:justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(ride);
                        }}
                        className="h-10 w-10 bg-icon-destructive/10 hover:bg-icon-destructive text-icon-destructive hover:text-white rounded-xl transition-all active:scale-95 flex items-center justify-center border border-icon-destructive/10 shadow-sm"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(ride);
                        }}
                        className="h-10 w-10 flex items-center justify-center bg-secondary/10 hover:bg-secondary/20 border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-95 shadow-sm"
                        title="Editar"
                    >
                        <Settings2 size={18} />
                    </button>
                    <div className="h-10 w-10 flex items-center justify-center bg-secondary/10 border border-border-subtle rounded-xl text-text-secondary shadow-inner">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

RideCard.displayName = "RideCard";
