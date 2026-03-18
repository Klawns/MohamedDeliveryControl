"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Bike,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    MapPin,
    Calendar,
    Wallet,
    TrendingUp,
    ArrowRight,
    CheckCircle2,
    Save,
    Pencil,
    Trash2,
    Lock,
    Crown,
    Info,
    Camera,
    Star,
    X
} from "lucide-react";
import { api } from "@/services/api";
import { uploadImage } from "@/lib/upload";

const RIDE_LIMIT_FREE = 20;
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PDFService } from "@/services/pdf-service";
import { useAuth } from "@/hooks/use-auth";
import { RidesChart } from "./rides-chart";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { RideModal } from "@/components/ride-modal";
import { ConfirmModal } from "@/components/confirm-modal";

interface MobileDashboardProps {
    onRideCreated: () => void;
}

const QUICK_VALUES = [10, 12, 15, 20, 25, 30];

export function MobileDashboard({ onRideCreated }: MobileDashboardProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [clients, setClients] = useState<any[]>([]);
    const [presets, setPresets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Stats State
    const [todayTotal, setTodayTotal] = useState(0);
    const [weekTotal, setWeekTotal] = useState(0);
    const [monthTotal, setMonthTotal] = useState(0);
    const [monthRides, setMonthRides] = useState<any[]>([]);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

    // Ride History
    const [recentRides, setRecentRides] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(0);
    const ridesPerPage = 5;

    // Client Creation Modal In-Page
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // Pagination for Clients
    const [clientPage, setClientPage] = useState(0);
    const clientsPerPage = 16; // 4x4 grid

    // Flow State
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [customValue, setCustomValue] = useState("");
    const [customLocation, setCustomLocation] = useState("");
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [rideStatus, setRideStatus] = useState<'PENDING' | 'COMPLETED'>('COMPLETED');
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PAID');
    const [rideDate, setRideDate] = useState("");
    const [notes, setNotes] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isRideModalOpen, setIsRideModalOpen] = useState(false);
    const [rideToEdit, setRideToEdit] = useState<any>(null);
    const [rideToDelete, setRideToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    useEffect(() => {
        loadHistory();
    }, [historyPage]);

    async function loadData() {
        try {
            const [clientsRes, presetsRes, today, week, month] = await Promise.all([
                api.get("/clients"),
                api.get("/settings/ride-presets"),
                api.get("/rides/stats?period=today"),
                api.get("/rides/stats?period=week"),
                api.get("/rides/stats?period=month"),
            ]);
            setClients(clientsRes.data.clients || []);
            setPresets(presetsRes.data);
            setTodayTotal(today.data.totalValue || 0);
            setWeekTotal(week.data.totalValue || 0);
            setMonthTotal(month.data.totalValue || 0);
            setMonthRides(month.data.rides || []);

            loadHistory();
        } catch (err) {
            console.error("Erro ao carregar dados mobile", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadHistory() {
        try {
            const { data } = await api.get(`/rides?limit=${ridesPerPage}&offset=${historyPage * ridesPerPage}`);
            setRecentRides(data.rides || []);
        } catch (err) {
            console.error("Erro ao carregar histórico", err);
        }
    }

    function handleRideSuccess() {
        setIsRideModalOpen(false);
        setRideToEdit(null);
        loadData();
        loadHistory();
        if (onRideCreated) onRideCreated();
    }

    async function handleConfirmRide() {
        if (!selectedClient) return;

        let finalValue = 0;
        let finalLocation = "";

        if (showCustomForm) {
            finalValue = Number(customValue);
            finalLocation = customLocation || "Central";
        } else if (selectedPresetId) {
            // Se houver um preset selecionado, usamos o que está no estado customLocation/customValue
            // O estado é sincronizado no clique do botão do preset
            finalValue = Number(customValue);
            finalLocation = customLocation || "Central";
        }

        if (!finalValue) {
            toast({ title: "Selecione um valor", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            let uploadedPhotoUrl = photo;

            if (photo && photo.startsWith('data:image')) {
                try {
                    const response = await fetch(photo);
                    const blob = await response.blob();
                    const file = new File([blob], "ride-photo.jpg", { type: blob.type });
                    const res = await uploadImage(file, 'rides');
                    uploadedPhotoUrl = res.url;
                } catch (uploadErr) {
                    console.error("Erro no upload R2:", uploadErr);
                    uploadedPhotoUrl = null;
                }
            }

            await api.post("/rides", {
                clientId: selectedClient.id,
                value: finalValue,
                location: finalLocation || "Central",
                notes: notes || undefined,
                photo: uploadedPhotoUrl || undefined,
                status: rideStatus,
                paymentStatus: paymentStatus,
                rideDate: rideDate || undefined
            });

            toast({ title: "Corrida registrada!", description: `R$ ${finalValue.toFixed(2)} para ${selectedClient.name}` });

            setSelectedClient(null);
            setSelectedPresetId(null);
            setShowCustomForm(false);
            setCustomValue("");
            setCustomLocation("");
            setRideDate("");
            setNotes("");
            setPhoto(null);
            setHistoryPage(0);

            onRideCreated();
            loadData();
        } catch (err) {
            toast({ title: "Erro ao registrar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleCreateClient() {
        if (!newClientName) return;
        setIsCreatingClient(true);
        try {
            const { data } = await api.post("/clients", { name: newClientName });
            setClients((prev: any[]) => [...prev, data]);
            setSelectedClient(data);
            setIsClientModalOpen(false);
            setNewClientName("");
            toast({ title: "Cliente cadastrado! 👤" });
        } catch (err) {
            toast({ title: "Erro ao cadastrar", variant: "destructive" });
        } finally {
            setIsCreatingClient(false);
        }
    }

    function handleOpenEdit(ride: any) {
        setRideToEdit(ride);
        setIsRideModalOpen(true);
    }

    async function handleDeleteRide() {
        if (!rideToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/rides/${rideToDelete.id}`);
            toast({ title: "Corrida excluída" });
            loadData();
            loadHistory();
            if (onRideCreated) onRideCreated();
            setRideToDelete(null);
        } catch (err) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleDeletePreset(id: string) {
        try {
            await api.delete(`/settings/ride-presets/${id}`);
            setPresets((prev: any[]) => prev.filter((p: any) => p.id !== id));
            toast({ title: "Atalho removido" });
        } catch (err) {
            toast({ title: "Erro ao remover atalho", variant: "destructive" });
        }
    }

    async function handleExportPDF(period: 'today' | 'week' | 'month') {
        try {
            const { data } = await api.get(`/rides/stats?period=${period}`);
            if (!data.rides || data.rides.length === 0) {
                toast({ title: "Sem dados para exportar" });
                return;
            }
            toast({ title: "Gerando PDF..." });
            await PDFService.generateReport(data.rides, { period, userName: user?.name || "Motorista" });
        } catch (err) {
            toast({ title: "Erro ao exportar", variant: "destructive" });
        }
    }

    const totalPages = Math.ceil(clients.length / clientsPerPage);
    const paginatedClients = clients.slice(clientPage * clientsPerPage, (clientPage + 1) * clientsPerPage);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* 0. Finance Stats Summary */}
            <section className="grid grid-cols-3 gap-2">
                {[
                    { label: "Hoje", val: todayTotal, color: "text-blue-400" },
                    { label: "Semana", val: weekTotal, color: "text-emerald-400" },
                    { label: "Mês", val: monthTotal, color: "text-violet-400" },
                ].map(s => (
                    <div key={s.label} className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 text-center">
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-tighter mb-1">{s.label}</p>
                        <p className={cn("text-xs font-bold truncate", s.color)}>{formatCurrency(s.val)}</p>
                    </div>
                ))}
            </section>

            {/* 1. Client Grid Section */}
            <section className="bg-slate-900/40 rounded-3xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={18} className="text-emerald-400" />
                        {selectedClient ? "Cliente" : "Selecione o Cliente"}
                    </h2>
                    {selectedClient && (
                        <button onClick={() => setSelectedClient(null)} className="text-xs text-blue-400 font-medium hover:underline">Trocar</button>
                    )}
                </div>

                {!selectedClient ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                            {paginatedClients.map((client: any) => (
                                <motion.button
                                    key={client.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedClient(client)}
                                    className="aspect-square bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-2 text-center"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-1 text-[10px] font-bold text-white uppercase overflow-hidden">
                                        {client.name.substring(0, 2)}
                                    </div>
                                    <span className="text-[10px] text-slate-300 font-medium truncate w-full">{client.name.split(" ")[0]}</span>
                                </motion.button>
                            ))}
                            <button
                                onClick={() => setIsClientModalOpen(true)}
                                className="aspect-square border border-dashed border-blue-500/30 bg-blue-500/5 rounded-2xl flex flex-col items-center justify-center p-2 group active:bg-blue-500/10 transition-colors"
                            >
                                <Plus size={16} className="text-blue-400" />
                                <span className="text-[10px] text-blue-400 mt-1 font-bold">Novo</span>
                            </button>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <button disabled={clientPage === 0} onClick={() => setClientPage((prev: number) => Math.max(0, prev - 1))} className="p-2 text-slate-400 disabled:opacity-30"><ChevronLeft size={18} /></button>
                                <span className="text-[10px] text-slate-500 font-bold">{clientPage + 1}/{totalPages}</span>
                                <button disabled={clientPage >= totalPages - 1} onClick={() => setClientPage((prev: number) => Math.min(totalPages - 1, prev + 1))} className="p-2 text-slate-400 disabled:opacity-30"><ChevronRight size={18} /></button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-lg">{selectedClient.name.substring(0, 2).toUpperCase()}</div>
                        <div>
                            <h3 className="font-bold text-white leading-none">{selectedClient.name}</h3>
                            <p className="text-xs text-blue-400 mt-1">Pronto para registrar</p>
                        </div>
                    </div>
                )}
            </section>

            {/* In-Page Modal for client creation */}
            <AnimatePresence>
                {isClientModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">Novo Cliente</h3>
                            <input autoFocus value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome do cliente..." className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 mb-4" />
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setIsClientModalOpen(false)} className="flex-1 text-slate-400">Cancelar</Button>
                                <Button onClick={handleCreateClient} disabled={!newClientName || isCreatingClient} className="flex-1 bg-blue-600 font-bold">{isCreatingClient ? "Criando..." : "Cadastrar"}</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 2. Selection and Save Area */}
            <AnimatePresence>
                {selectedClient && (
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-3">
                                <p className="text-[9px] text-slate-500 uppercase font-black mb-2">Status do Pagamento</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPaymentStatus('PENDING')} className={cn("flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest", paymentStatus === 'PENDING' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-slate-500")}>Não Pago</button>
                                    <button onClick={() => setPaymentStatus('PAID')} className={cn("flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest", paymentStatus === 'PAID' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-slate-500")}>Pago</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><MapPin size={18} className="text-blue-400" />Valor e Local</h2>
                            <div className="grid grid-cols-3 gap-2.5 mb-4">
                                {QUICK_VALUES.map((v) => {
                                    const matchingPreset = presets.find((p: any) => p.value === v);
                                    const displayId = matchingPreset?.id || `default-${v}`;
                                    const isSelected = (!showCustomForm && (selectedPresetId === displayId || (customValue === String(v) && !selectedPresetId)));

                                    return (
                                        <div key={displayId} className="relative group/preset">
                                            <button
                                                onClick={() => {
                                                    if (matchingPreset) {
                                                        setSelectedPresetId(matchingPreset.id);
                                                        setCustomValue(String(matchingPreset.value));
                                                        setCustomLocation(matchingPreset.location || "Central");
                                                        setShowCustomForm(false);
                                                    } else {
                                                        setSelectedPresetId(displayId);
                                                        setCustomValue(String(v));
                                                        setCustomLocation("Central");
                                                        setShowCustomForm(false);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full rounded-2xl p-4 text-center border transition-all flex flex-col justify-center items-center shadow-sm",
                                                    isSelected 
                                                        ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20" 
                                                        : "bg-white/5 border-white/5"
                                                )}
                                            >
                                                <div className={cn("text-base font-black", isSelected ? "text-white" : "text-blue-400")}>
                                                    R$ {v}
                                                </div>
                                            </button>
                                            {matchingPreset && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePreset(matchingPreset.id);
                                                    }}
                                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all opacity-0 group-hover/preset:opacity-100"
                                                >
                                                    <Trash2 size={10} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                <button onClick={() => {
                                    setShowCustomForm(!showCustomForm);
                                    setSelectedPresetId(null);
                                }} className={cn("rounded-2xl p-3 text-left border transition-all flex flex-col justify-center", showCustomForm ? "bg-blue-600/20 border-blue-500" : "bg-white/5 border-white/5")}>
                                    <div className="flex items-center gap-2 text-white font-bold text-xs"><Plus size={14} />Outro</div>
                                    <p className="text-[9px] text-slate-500 mt-0.5 italic">Manual</p>
                                </button>
                            </div>

                            <div className="flex items-center gap-2 px-1 mb-4 mt-2">
                                <Star size={10} className="text-blue-500/50" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-tight">
                                    Gerencie valores e locais em <Link href="/dashboard/settings" className="text-blue-500 hover:underline">Configurações</Link>
                                </p>
                            </div>

                            <AnimatePresence>
                                {(selectedPresetId || showCustomForm) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4 pt-2 mb-4">
                                        {showCustomForm && (
                                            <div className="grid grid-cols-1 gap-2">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">R$</span>
                                                    <input type="number" value={customValue} onChange={e => setCustomValue(e.target.value)} placeholder="0,00" className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm font-black outline-none focus:border-blue-500" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <MapPin size={14} className="text-blue-500" />
                                                Localização da Corrida
                                            </label>
                                            <input 
                                                type="text" 
                                                value={customLocation} 
                                                onChange={e => setCustomLocation(e.target.value)} 
                                                placeholder="Onde será a corrida?" 
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-500" 
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Campo de Data Opcional */}
                            <div className="border-t border-white/5 pt-4 mt-2 space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar size={14} className="text-blue-500/50" />
                                    Data da Corrida <span className="lowercase italic font-medium opacity-40">(opcional)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={rideDate}
                                    onChange={(e) => setRideDate(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:ring-1 focus:ring-blue-500/30 transition-all [color-scheme:dark]"
                                />
                            </div>

                            {/* Nova Seção: Observação & Foto (Mobile First) */}
                            <div className="group/notes border-t border-white/5 pt-4 mt-2 mb-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText size={14} className="text-blue-500/50" />
                                        Observação <span className="lowercase italic font-medium opacity-40">(opcional)</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-lg text-blue-400 cursor-pointer active:scale-95 transition-all text-[10px] font-black uppercase tracking-tight">
                                        <Camera size={14} />
                                        Tirar Foto
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                                    </label>
                                </div>

                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ex: Deixar na portaria, troco para 50..."
                                    rows={2}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:ring-1 focus:ring-blue-500/30 resize-none transition-all placeholder:text-slate-700"
                                />

                                <AnimatePresence>
                                    {photo && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="relative inline-block group/photo"
                                        >
                                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl">
                                                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setPhoto(null)}
                                                    className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} className="text-white drop-shadow-xl" />
                                                </button>
                                            </div>
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border-2 border-slate-900">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                                onClick={handleConfirmRide}
                                disabled={isSaving || (!selectedPresetId && (!customValue || !customLocation))}
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Salvando</span>
                                ) : (
                                    <><Save size={20} /> SALVAR CORRIDA</>
                                )}
                            </Button>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* 3. History Section */}
            <section className="bg-slate-900/40 rounded-3xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock size={18} className="text-violet-400" />
                        Corridas Recentes
                    </h2>
                </div>
                <div className="space-y-2">
                    {recentRides.length === 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-white font-black italic">ROTTA</span>
                        </div>
                    ) : (
                        recentRides.map((r: any) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={r.id}
                                onClick={() => handleOpenEdit(r)}
                                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3 max-w-[60%]">
                                    <div className="p-2 rounded-xl bg-white/5 text-slate-400 group-active:text-blue-400 transition-colors">
                                        <Pencil size={14} />
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white truncate">{r.client?.name || "Cliente"}</span>
                                            {(r.notes || r.photo) && (
                                                <div className="flex gap-1 opacity-40">
                                                    {r.notes && <FileText size={8} />}
                                                    {r.photo && <Camera size={8} />}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                            <MapPin size={8} /> {r.location || "Central"} • {new Date(r.rideDate || r.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} {new Date(r.rideDate || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1.5">
                                    <span className="text-sm font-black text-white leading-none mb-0.5">{formatCurrency(r.value)}</span>
                                    <div className="flex w-full">
                                        <span className={cn(
                                            "text-[8px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border text-center flex-1",
                                            r.paymentStatus === 'PAID'
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-red-500/10 text-red-500 border-red-500/20"
                                        )}>
                                            {r.paymentStatus === 'PAID' ? "Pago" : "Não Pago"}
                                        </span>
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRideToDelete(r);
                                            }}
                                            className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all active:scale-90"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
                <div className="flex items-center justify-center gap-8 mt-6 pb-2">
                    <button
                        disabled={historyPage === 0}
                        onClick={(e) => { e.stopPropagation(); setHistoryPage((p: number) => p - 1); }}
                        className="p-2 transition-colors text-slate-400 disabled:opacity-20 flex items-center gap-1 text-[10px] font-bold"
                    >
                        <ChevronLeft size={16} /> ANTERIOR
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setHistoryPage((p: number) => p + 1); }}
                        disabled={recentRides.length < ridesPerPage}
                        className="p-2 transition-colors text-slate-400 disabled:opacity-20 flex items-center gap-1 text-[10px] font-bold"
                    >
                        PRÓXIMA <ChevronRight size={16} />
                    </button>
                </div>
            </section>

            <RidesChart rides={monthRides} />

            <section className="bg-slate-900/40 rounded-3xl border border-white/5 p-5">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText size={18} className="text-orange-400" />
                        Exportar PDF
                    </h2>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {['today', 'week', 'month'].map(p => (
                        <button key={p} onClick={() => handleExportPDF(p as any)} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-orange-500/20 transition-all">
                            <Calendar size={18} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 flex items-start gap-3 mb-4">
                    <Info size={16} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] text-orange-200/70 leading-relaxed font-medium">
                            Para filtros detalhados por data ou cliente, acesse o painel financeiro completo.
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-center">
                    <Link href="/dashboard/finance" className="block">
                        <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black h-12 rounded-2xl text-xs gap-2 active:scale-95 transition-all">
                            PAINEL FINANCEIRO <ArrowRight size={14} />
                        </Button>
                    </Link>
                </div>
            </section>

            <RideModal
                isOpen={isRideModalOpen}
                onClose={() => {
                    setIsRideModalOpen(false);
                    setRideToEdit(null);
                }}
                onSuccess={handleRideSuccess}
                rideToEdit={rideToEdit}
            />

            <ConfirmModal
                isOpen={!!rideToDelete}
                onClose={() => setRideToDelete(null)}
                onConfirm={handleDeleteRide}
                title="Excluir Corrida"
                description="Deseja realmente excluir esta corrida?"
                confirmText="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />

            <Dialog open={isLimitModalOpen} onOpenChange={setIsLimitModalOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white rounded-[2rem] w-[95%] max-w-sm mx-auto p-8 text-center overflow-hidden relative">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl" />

                    <div className="relative z-10 space-y-6">
                        <div className="mx-auto w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center animate-bounce">
                            <Crown size={40} className="text-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">Limite Atingido! 🚀</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Você atingiu o limite de **{RIDE_LIMIT_FREE} corridas** do plano gratuito.
                                Faça upgrade para o **Premium** e tenha registros ilimitados, relatórios PDF e muito mais!
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link href="/dashboard/settings" className="block">
                                <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 text-md gap-2">
                                    VER PLANOS PREMIUM <ArrowRight size={18} />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                onClick={() => setIsLimitModalOpen(false)}
                                className="w-full text-slate-500 font-bold h-12 rounded-xl"
                            >
                                Talvez mais tarde
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                            <span>Rotta Platinum</span>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-blue-500" />
                                <div className="w-1 h-1 rounded-full bg-violet-500" />
                                <div className="w-1 h-1 rounded-full bg-blue-500" />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
