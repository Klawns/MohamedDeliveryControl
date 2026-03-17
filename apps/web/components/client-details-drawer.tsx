"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, X, Bike, Trash2, Calendar, ChevronRight, FileText, DollarSign, Pencil } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface Client {
    id: string;
    name: string;
    userId: string;
    isPinned: boolean;
    createdAt: string;
}

interface Ride {
    id: string;
    clientId: string;
    value: number;
    notes?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID';
    rideDate?: string;
    createdAt: string;
}

interface ClientBalance {
    totalDebt: number;
    totalPaid: number;
    remainingBalance: number;
}

interface ClientDetailsDrawerProps {
    client: Client | null;
    rides: Ride[];
    balance: ClientBalance | null;
    ridePage: number;
    rideTotal: number;
    rideLimit: number;
    isSettling: boolean;
    isDeleting: boolean;
    onClose: () => void;
    onNewRide: () => void;
    onCloseDebt: () => void;
    onAddPayment: () => void;
    onGeneratePDF: () => void;
    onDeleteClient: () => void;
    onEditRide: (ride: Ride) => void;
    onDeleteRide: (ride: Ride) => void;
    onPageChange: (page: number) => void;
}

export function ClientDetailsDrawer({
    client,
    rides,
    balance,
    ridePage,
    rideTotal,
    rideLimit,
    isSettling,
    isDeleting,
    onClose,
    onNewRide,
    onCloseDebt,
    onAddPayment,
    onGeneratePDF,
    onDeleteClient,
    onEditRide,
    onDeleteRide,
    onPageChange,
}: ClientDetailsDrawerProps) {
    if (!client) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="bg-[#020617] border-l border-white/10 w-full max-w-xl relative z-10 shadow-2xl h-screen overflow-y-auto"
                >
                    <div className="p-8 lg:p-12 space-y-10">
                        <header className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-400">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">{client.name}</h2>
                                    <p className="text-slate-500">ID: {client.id.split("-")[0]}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </header>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onNewRide}
                                className="flex flex-col items-center gap-2 p-6 bg-blue-600 hover:bg-blue-500 rounded-[2rem] text-white transition-all group shadow-xl shadow-blue-600/20 active:scale-95"
                            >
                                <Bike size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">Nova Corrida</span>
                            </button>
                            <button
                                onClick={onDeleteClient}
                                disabled={isDeleting}
                                className="flex flex-col items-center gap-2 p-6 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-[2rem] transition-all group border border-red-500/10 active:scale-95 disabled:opacity-50"
                            >
                                <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">{isDeleting ? "Excluindo..." : "Excluir Cliente"}</span>
                            </button>
                        </div>

                        <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest text-center">Controle Financeiro</h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={onAddPayment}
                                    className="flex flex-col items-center gap-3 p-6 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-3xl transition-all group border border-emerald-500/10 active:scale-95 shadow-lg shadow-emerald-600/0 hover:shadow-emerald-600/20"
                                >
                                    <DollarSign size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-black text-[10px] uppercase">Pagar Parcial</span>
                                </button>
                                <button
                                    onClick={onGeneratePDF}
                                    className="flex flex-col items-center gap-3 p-6 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-3xl transition-all group border border-blue-500/10 active:scale-95 shadow-lg shadow-blue-600/0 hover:shadow-blue-600/20"
                                >
                                    <FileText size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="font-black text-[10px] uppercase">Gerar PDF</span>
                                </button>
                            </div>

                            {balance && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Total em Corridas Pendentes</span>
                                        <span className="text-white font-black">{formatCurrency(balance.totalDebt)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-500/80 font-bold uppercase text-[10px] tracking-wider">Total Pago (Parcial)</span>
                                        <span className="text-emerald-400 font-black">- {formatCurrency(balance.totalPaid)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-emerald-500/20">
                                        <span className="font-black text-white text-xs uppercase tracking-widest text-slate-400">Saldo devedor</span>
                                        <span className={cn(
                                            "font-black text-2xl tracking-tighter",
                                            balance.remainingBalance > 0 ? "text-amber-400" : "text-emerald-400"
                                        )}>
                                            {formatCurrency(balance.remainingBalance)}
                                        </span>
                                    </div>

                                    {balance.remainingBalance > 0 && (
                                        <button
                                            onClick={onCloseDebt}
                                            disabled={isSettling}
                                            className="w-full py-5 bg-white text-slate-950 hover:bg-emerald-400 font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 mt-2 uppercase tracking-widest text-xs"
                                        >
                                            {isSettling ? "PROCESSANDO..." : "QUITAR DÍVIDA TOTAL"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Histórico de Corridas</h3>
                                <span className="text-xs font-bold text-slate-500 uppercase bg-white/5 px-3 py-1 rounded-full">{rideTotal} totais</span>
                            </div>

                            <div className="space-y-4">
                                {rides.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                                        <p className="text-slate-500 text-sm">Nenhuma corrida registrada para este cliente.</p>
                                    </div>
                                ) : (
                                    <>
                                        {rides.map((ride) => (
                                            <div key={ride.id} className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                                    <Calendar size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-white truncate">ID: {ride.id.split("-")[0]}</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{new Date(ride.rideDate || ride.createdAt).toLocaleString()}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                                            ride.status === 'COMPLETED' ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                                                        )}>
                                                            {ride.status === 'COMPLETED' ? 'OK' : 'Pendente'}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                                            ride.paymentStatus === 'PAID' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                                        )}>
                                                            {ride.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    <p className="font-extrabold text-white text-lg">{formatCurrency(ride.value)}</p>
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => onEditRide(ride)}
                                                            className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all active:scale-90"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteRide(ride)}
                                                            className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all active:scale-90"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {rideTotal > rideLimit && (
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                    Página <span className="text-white">{ridePage}</span> de <span className="text-white">{Math.ceil(rideTotal / rideLimit)}</span>
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={ridePage === 1}
                                                        onClick={() => onPageChange(ridePage - 1)}
                                                        className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        Anterior
                                                    </button>
                                                    <button
                                                        disabled={ridePage * rideLimit >= rideTotal}
                                                        onClick={() => onPageChange(ridePage + 1)}
                                                        className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        Próxima
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
