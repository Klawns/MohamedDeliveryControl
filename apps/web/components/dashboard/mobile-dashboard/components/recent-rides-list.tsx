"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, FileText, Camera, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Ride } from "../types";
import { DashboardCompactRidesContainer } from "@/components/ui/dashboard-compact-rides-container";

interface RecentRidesListProps {
    rides: Ride[];
    onEdit: (ride: Ride) => void;
    onDelete: (ride: Ride) => void;
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    error: any;
    retry: () => void;
}

import { RideListSkeleton } from "./ride-list-skeleton";

export function RecentRidesList({ 
    rides, 
    onEdit, 
    onDelete,
    isLoading,
    hasMore,
    onLoadMore,
    error,
    retry
}: RecentRidesListProps) {
    return (
        <section className="bg-card-background rounded-3xl border border-border-subtle p-4 flex flex-col overflow-hidden min-h-[300px] shadow-sm">
            <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
                <h2 className="text-lg font-display font-extrabold text-text-primary flex items-center gap-2">
                    <Clock size={18} className="text-primary" />
                    Corridas Recentes
                </h2>
                {isLoading && rides.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
            </div>
            
            {isLoading && rides.length === 0 ? (
                <RideListSkeleton count={3} />
            ) : rides.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-20 flex-1">
                    <span className="text-4xl font-display font-black italic tracking-widest text-text-primary">ROTTA</span>
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest mt-2">Nenhuma corrida encontrada</p>
                </div>
            ) : (
                <DashboardCompactRidesContainer
                    items={rides}
                    maxHeight="35vh"
                    hasMore={hasMore}
                    isLoading={isLoading}
                    onLoadMore={onLoadMore}
                    error={error}
                    retry={retry}
                    gap={12}
                    renderItem={(r: Ride) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onEdit(r)}
                            className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border-subtle active:bg-hover-accent transition-all cursor-pointer group relative min-h-[90px]"
                        >
                            <div className="flex items-center gap-4 max-w-[65%]">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-active:scale-95 transition-all">
                                    <Pencil size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-display font-bold text-text-primary truncate">
                                            {r.clientName || "Cliente"}
                                        </span>
                                        {(r.notes || r.photo) && (
                                            <div className="flex gap-1.5 opacity-40">
                                                {r.notes && <FileText size={10} />}
                                                {r.photo && <Camera size={10} />}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1.5 font-medium">
                                        <MapPin size={10} className="text-primary/50" /> 
                                        {r.location || "Central"} • {new Date(r.rideDate || r.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 pr-2">
                                <span className="text-base font-display font-extrabold text-text-primary tracking-tighter">
                                    {formatCurrency(r.value)}
                                </span>
                                <span className={cn(
                                    "text-[9px] px-2.5 py-1 rounded-lg font-display font-bold uppercase tracking-widest border text-center shadow-sm",
                                    r.paymentStatus === 'PAID'
                                        ? "bg-icon-success/10 text-icon-success border-icon-success/20"
                                        : "bg-icon-warning/10 text-icon-warning border-icon-warning/20"
                                )}>
                                    {r.paymentStatus === 'PAID' ? "Pago" : "Pendente"}
                                </span>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(r);
                                }}
                                className="absolute -bottom-1 -right-1 p-2 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all active:scale-90"
                            >
                                <Trash2 size={12} />
                            </button>
                        </motion.div>
                    )}
                />
            )}
        </section>
    );
}
