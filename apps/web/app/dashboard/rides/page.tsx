"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Search, Plus, Filter, Calendar, ChevronRight, X, Clock, User, Star, ArrowRight, MessageSquare, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { formatCurrency, cn } from "@/lib/utils";
import { RideModal } from "@/components/ride-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Ride {
    id: string;
    clientId: string;
    value: number;
    notes?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID';
    rideDate?: string;
    createdAt: string;
    clientName?: string;
    client?: {
        name: string;
    };
}

interface Client {
    id: string;
    name: string;
}

interface FrequentClient extends Client {
    isPinned: boolean;
}

export default function RidesPage() {
    const [rides, setRides] = useState<Ride[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [frequentClients, setFrequentClients] = useState<FrequentClient[]>([]);
    const [search, setSearch] = useState("");
    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [selectedQuickClient, setSelectedQuickClient] = useState<{ id: string, name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rideToEdit, setRideToEdit] = useState<Ride | null>(null);
    const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    // Pagination & Filters State
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [clientFilter, setClientFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [page, statusFilter, paymentFilter, clientFilter, startDate, endDate, search, user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("limit", pageSize.toString());
            params.append("offset", ((page - 1) * pageSize).toString());

            if (statusFilter !== "all") params.append("status", statusFilter);
            if (paymentFilter !== "all") params.append("paymentStatus", paymentFilter);
            if (clientFilter !== "all") params.append("clientId", clientFilter);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (search) params.append("search", search);

            const [ridesRes, clientsRes, frequentRes] = await Promise.all([
                api.get(`/rides?${params.toString()}`),
                api.get("/clients"),
                api.get("/rides/frequent-clients")
            ]);

            const ridesData = ridesRes.data.rides || [];
            const total = ridesRes.data.total || 0;

            // Map client names to rides
            const clientMap = new Map(clientsRes.data.clients?.map((c: Client) => [c.id, c.name]) || []);

            const enrichedRides = ridesData.map((r: Ride) => ({
                ...r,
                clientName: r.client?.name || r.clientName || clientMap.get(r.clientId) || "Cliente Removido"
            }));

            setRides(enrichedRides);
            setTotalCount(total);
            setClients(clientsRes.data.clients || []);
            setFrequentClients(frequentRes.data);
        } catch (err) {
            console.error("Erro ao buscar dados", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditRide = (ride: Ride) => {
        setRideToEdit(ride);
        setIsRideModalOpen(true);
    };

    const handleDeleteRide = async () => {
        if (!rideToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/rides/${rideToDelete.id}`);
            toast({
                title: "Corrida excluída",
                description: "A corrida foi removida com sucesso.",
            });
            fetchData();
            setRideToDelete(null);
        } catch (err) {
            console.error("Erro ao excluir corrida", err);
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir a corrida. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const togglePaymentStatus = async (ride: Ride) => {
        const newStatus = ride.paymentStatus === 'PAID' ? 'PENDING' : 'PAID';
        try {
            await api.patch(`/rides/${ride.id}/status`, { paymentStatus: newStatus });
            fetchData();
        } catch (err) {
            console.error("Erro ao atualizar pagamento", err);
        }
    };

    const filteredRides = rides.filter(r =>
        r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Histórico de Corridas</h1>
                    <p className="text-slate-400 mt-1">Veja todas as suas atividades e faturamento histórico.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedQuickClient(null);
                        setIsRideModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    Nova Corrida
                </button>
            </header>

            {/* Clientes Fixados - Acesso Rápido */}
            <AnimatePresence>
                {!isLoading && frequentClients.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-2 px-1">
                            <Star size={14} className="text-blue-400 fill-blue-400" />
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Clientes Fixados</h2>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {frequentClients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => {
                                        setSelectedQuickClient({ id: client.id, name: client.name });
                                        setIsRideModalOpen(true);
                                    }}
                                    className="bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 transition-all group active:scale-95"
                                >
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <User size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-white leading-tight">{client.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Fixado</p>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
                <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-blue-400 transition-colors text-slate-500">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou ID da corrida..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border",
                            isFiltersOpen ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-900 hover:border-white/10"
                        )}
                    >
                        <Filter size={20} />
                        {isFiltersOpen ? "Fechar Filtros" : "Filtros"}
                    </button>
                    {(statusFilter !== "all" || paymentFilter !== "all" || clientFilter !== "all" || startDate || endDate) && (
                        <button
                            onClick={() => {
                                setStatusFilter("all");
                                setPaymentFilter("all");
                                setClientFilter("all");
                                setStartDate("");
                                setEndDate("");
                                setPage(1);
                            }}
                            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                            title="Limpar Filtros"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Expansão de Filtros */}
            <AnimatePresence>
                {isFiltersOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-900/30 border border-white/5 rounded-[2rem]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status da Corrida</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="all">Todos os Status</option>
                                    <option value="COMPLETED">Concluída</option>
                                    <option value="PENDING">Pendente</option>
                                    <option value="CANCELLED">Cancelada</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pagamento</label>
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="all">Todos os Pagamentos</option>
                                    <option value="PAID">Pago</option>
                                    <option value="PENDING">Não Pago</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cliente</label>
                                <select
                                    value={clientFilter}
                                    onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="all">Todos os Clientes</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Período (Início - Fim)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                                    />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        {rides.length === 0 ? (
                            <div className="text-center py-20 glass-card rounded-[2rem] border border-dashed border-white/10">
                                <Bike size={48} className="mx-auto text-slate-700 mb-4" />
                                <h3 className="text-xl font-bold text-slate-400">Nenhuma corrida encontrada</h3>
                                <p className="text-slate-500 mt-1">Ajuste os filtros ou inicie uma nova corrida.</p>
                            </div>
                        ) : (
                            rides.map((ride, index) => (
                                <motion.div
                                    key={ride.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleEditRide(ride)}
                                    className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group flex flex-col md:flex-row md:items-center gap-6 cursor-pointer"
                                >
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                            <Bike size={24} />
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-bold text-white text-lg">Corrida #{ride.id.split("-")[0]}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 uppercase tracking-wider font-extrabold">
                                                    <User size={12} className="text-blue-400" />
                                                    {ride.clientName}
                                                </p>
                                            </div>

                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                    <Clock size={14} />
                                                    {new Date(ride.rideDate || ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                                    <Calendar size={12} />
                                                    {new Date(ride.rideDate || ride.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {ride.notes && (
                                        <div className="md:max-w-xs flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <MessageSquare size={14} className="text-slate-500 mt-1 flex-shrink-0" />
                                            <p className="text-xs text-slate-400 italic">"{ride.notes}"</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                ride.status === 'COMPLETED' ? "bg-blue-500/10 text-blue-400" :
                                                    ride.status === 'PENDING' ? "bg-amber-500/10 text-amber-400" :
                                                        "bg-red-500/10 text-red-400"
                                            )}>
                                                {ride.status === 'COMPLETED' ? 'Concluída' : ride.status === 'PENDING' ? 'Pendente' : 'Cancelada'}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePaymentStatus(ride);
                                                }}
                                                className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all active:scale-95",
                                                    ride.paymentStatus === 'PAID' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                )}
                                            >
                                                {ride.paymentStatus === 'PAID' ? 'Pago' : 'Não Pago'}
                                            </button>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className="text-2xl font-black text-white">{formatCurrency(ride.value)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRideToDelete(ride);
                                                }}
                                                className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all active:scale-95 opacity-0 group-hover:opacity-100"
                                                title="Excluir Corrida"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Controles de Paginação */}
                    {totalCount > pageSize && (
                        <div className="flex items-center justify-between mt-10 px-2">
                            <p className="text-sm text-slate-500 font-medium">
                                Mostrando <span className="text-white">{(page - 1) * pageSize + 1}</span>-
                                <span className="text-white">{Math.min(page * pageSize, totalCount)}</span> de <span className="text-white">{totalCount}</span> corridas
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={page * pageSize >= totalCount}
                                    onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <RideModal
                isOpen={isRideModalOpen}
                onClose={() => {
                    setIsRideModalOpen(false);
                    setSelectedQuickClient(null);
                    setRideToEdit(null);
                }}
                onSuccess={fetchData}
                clientId={selectedQuickClient?.id}
                clientName={selectedQuickClient?.name}
                rideToEdit={rideToEdit}
            />

            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={() => setRideToDelete(null)}
                onConfirm={handleDeleteRide}
                title="Excluir Corrida"
                description="Deseja realmente excluir esta corrida? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
