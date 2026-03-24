"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, Bike, Trash2, Calendar, ChevronRight, FileText, DollarSign, Pencil } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { HybridInfiniteList } from "@/components/ui/hybrid-infinite-list";

import { Client, Ride, ClientBalance } from "@/types/rides";

interface ClientDetailsDrawerProps {
    client: Client | null;
    rides: Ride[];
    balance: ClientBalance | null;
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    isSettling: boolean;
    isDeleting: boolean;
    onClose: () => void;
    onNewRide: () => void;
    onCloseDebt: () => void;
    onAddPayment: () => void;
    onGeneratePDF: () => void;
    onGenerateExcel: () => void;
    onDeleteClient: () => void;
    onEditRide: (ride: Ride) => void;
    onDeleteRide: (ride: Ride) => void;
    fetchNextPage: () => void;
}

export function ClientDetailsDrawer({
    client,
    rides,
    balance,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isSettling,
    isDeleting,
    onClose,
    onNewRide,
    onCloseDebt,
    onAddPayment,
    onGeneratePDF,
    onGenerateExcel,
    onDeleteClient,
    onEditRide,
    onDeleteRide,
    fetchNextPage,
}: ClientDetailsDrawerProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (client) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [client]);

    if (!client) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-overlay-background backdrop-blur-sm"
                />
                <motion.div
                    ref={scrollContainerRef}
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="bg-drawer-background border-l border-border w-full max-w-xl relative z-10 shadow-2xl h-screen overflow-y-auto scrollbar-hide"
                >
                    <div className="p-8 lg:p-12 space-y-10">
                        <header className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-icon-info/10 rounded-2xl text-icon-info font-black shadow-inner border border-icon-info/10">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">{client.name}</h2>
                                    <p className="text-text-secondary text-sm font-medium">ID: {client.id.split("-")[0]}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary/10 rounded-xl text-text-secondary hover:text-text-primary transition-colors active:scale-95 border border-transparent hover:border-border-subtle"
                            >
                                <X size={24} />
                            </button>
                        </header>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onNewRide}
                                className="flex flex-col items-center gap-2 p-6 bg-button-primary hover:bg-button-primary-hover rounded-[2rem] text-button-primary-foreground transition-all group shadow-xl shadow-button-shadow active:scale-95"
                            >
                                <Bike size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">Nova Corrida</span>
                            </button>
                            <button
                                onClick={onDeleteClient}
                                disabled={isDeleting}
                                className="flex flex-col items-center gap-2 p-6 bg-button-destructive-subtle hover:bg-button-destructive text-icon-destructive hover:text-button-destructive-foreground rounded-[2rem] transition-all group border border-border-destructive/10 active:scale-95 disabled:opacity-50 shadow-lg shadow-destructive/5 hover:shadow-destructive/20"
                            >
                                <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">{isDeleting ? "Excluindo..." : "Excluir Cliente"}</span>
                            </button>
                        </div>

                        <section className="bg-background/50 border border-border-subtle rounded-[2.5rem] p-8 space-y-6">
                            <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest text-center opacity-80">Controle Financeiro</h3>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                <button
                                    onClick={onAddPayment}
                                    className="flex flex-col items-center gap-3 p-6 bg-icon-brand/10 hover:bg-icon-brand text-icon-brand hover:text-white rounded-3xl transition-all group border border-icon-brand/10 active:scale-95 shadow-lg shadow-brand/0 hover:shadow-brand/20"
                                >
                                    <DollarSign size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-black text-[10px] uppercase">Pagar Parcial</span>
                                </button>
                                <button
                                    onClick={onGeneratePDF}
                                    className="flex flex-col items-center gap-3 p-6 bg-icon-info/10 hover:bg-icon-info text-icon-info hover:text-white rounded-3xl transition-all group border border-icon-info/10 active:scale-95 shadow-lg shadow-info/0 hover:shadow-info/20"
                                >
                                    <FileText size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-black text-[10px] uppercase">PDF</span>
                                </button>
                                <button
                                    onClick={onGenerateExcel}
                                    className="flex flex-col items-center gap-3 p-6 bg-icon-success/10 hover:bg-icon-success text-icon-success hover:text-white rounded-3xl transition-all group border border-icon-success/10 active:scale-95 shadow-lg shadow-success/0 hover:shadow-success/20"
                                >
                                    <FileText size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-black text-[10px] uppercase">Planilha</span>
                                </button>
                            </div>

                            {balance && (
                                <div className="space-y-4 pt-4 border-t border-border-subtle">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary font-bold uppercase text-[10px] tracking-wider">Total em Corridas Pendentes</span>
                                        <span className="text-text-primary font-black">{formatCurrency(balance.totalDebt)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-icon-brand/80 font-bold uppercase text-[10px] tracking-wider">Total Pago (Parcial)</span>
                                        <span className="text-icon-brand font-black">- {formatCurrency(balance.totalPaid)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-border-strong">
                                        <span className="font-black text-text-primary text-xs uppercase tracking-widest opacity-60">Saldo devedor</span>
                                        <span className={cn(
                                            "font-black text-2xl tracking-tighter",
                                            balance.remainingBalance > 0 ? "text-icon-warning" : "text-icon-success"
                                        )}>
                                            {formatCurrency(balance.remainingBalance)}
                                        </span>
                                    </div>

                                    {balance.remainingBalance > 0 && (
                                        <button
                                            onClick={onCloseDebt}
                                            disabled={isSettling}
                                            className="w-full py-5 bg-button-primary text-button-primary-foreground hover:bg-button-primary-hover font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 mt-2 uppercase tracking-widest text-xs shadow-lg shadow-button-shadow"
                                        >
                                            {isSettling ? "PROCESSANDO..." : "QUITAR DÍVIDA TOTAL"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-text-primary">Histórico de Corridas</h3>
                                <span className="text-xs font-bold text-text-secondary uppercase bg-secondary/10 px-3 py-1 rounded-full border border-border-subtle">Recentes</span>
                            </div>

                            <HybridInfiniteList<Ride>
                                items={rides}
                                estimateSize={110}
                                containerRef={scrollContainerRef}
                                hasMore={hasNextPage}
                                onLoadMore={fetchNextPage}
                                isLoading={isLoading && rides.length === 0}
                                isFetchingNextPage={isFetchingNextPage}
                                gap={16}
                                className="pb-10"
                                renderItem={(ride: Ride) => (
                                    <div key={ride.id} className="flex items-center gap-4 p-5 bg-card-background/50 rounded-2xl border border-border-subtle group hover:bg-card-background transition-colors shadow-sm hover:shadow-md">
                                        <div className="p-3 bg-icon-info/10 rounded-xl text-icon-info border border-icon-info/10">
                                            <Calendar size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-text-primary truncate">ID: {String(ride.id).split("-")[0]}</h4>
                                            <p className="text-[10px] text-text-secondary mt-0.5 font-medium">{new Date(ride.rideDate || ride.createdAt).toLocaleString()}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                    ride.paymentStatus === 'PAID' 
                                                        ? "bg-icon-success/10 text-icon-success border-icon-success/10" 
                                                        : "bg-icon-warning/10 text-icon-warning border-icon-warning/10"
                                                )}>
                                                    {ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className="font-extrabold text-text-primary text-lg tracking-tight">{formatCurrency(ride.value)}</p>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEditRide(ride)}
                                                    className="p-2 bg-icon-info/10 hover:bg-icon-info text-icon-info hover:text-white rounded-lg transition-all active:scale-90 border border-icon-info/10"
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteRide(ride)}
                                                    className="p-2 bg-icon-destructive/10 hover:bg-icon-destructive text-icon-destructive hover:text-white rounded-lg transition-all active:scale-90 border border-icon-destructive/10"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            />
                        </section>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
