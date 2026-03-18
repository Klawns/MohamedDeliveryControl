"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bike, User, DollarSign, FileText, CheckCircle2, Calendar, Plus, Camera, Trash2, ChevronRight, Star, MapPin } from "lucide-react";
import { api } from "@/services/api";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface Client {
    id: string;
    name: string;
    isPinned: boolean;
}

interface RideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clientId?: string; // Se fornecido, pula a seleção de cliente
    clientName?: string;
    rideToEdit?: any; // Dados da corrida a ser editada
}

const QUICK_VALUES = [10, 12, 15, 20, 25, 30];

export function RideModal({ isOpen, onClose, onSuccess, clientId, clientName, rideToEdit }: RideModalProps) {
    const { verify, user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [presets, setPresets] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState(clientId || "");
    const [value, setValue] = useState<string>("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [rideDate, setRideDate] = useState("");
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>("PAID");
    const [status, setStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED'>("COMPLETED");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isCustomValue, setIsCustomValue] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [newClientName, setNewClientName] = useState("");
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [clientPage, setClientPage] = useState(0);
    const clientsPerPage = 12;

    useEffect(() => {
        if (isOpen && user) {
            loadInitialData();

            if (rideToEdit) {
                setSelectedClientId(rideToEdit.clientId);
                setValue(rideToEdit.value.toString());
                setLocation(rideToEdit.location || "");
                setNotes(rideToEdit.notes || "");
                setRideDate(rideToEdit.rideDate ? rideToEdit.rideDate.substring(0, 16) : "");
                setPaymentStatus(rideToEdit.paymentStatus);
                setStatus(rideToEdit.status);
                setPhoto(rideToEdit.photo || null);
                setIsCustomValue(true);
                setCurrentStep(2); // Pula seleção de cliente ao editar
            } else {
                // Reset to defaults when opening for new ride
                setPaymentStatus("PAID");
                setStatus("COMPLETED");
                setPhoto(null);
                setSelectedClientId(clientId || "");
                setValue("");
                setLocation("");
                setNotes("");
                setRideDate("");
                setIsCustomValue(false);
                setCurrentStep(clientId ? 2 : 1);
            }
        }
    }, [isOpen, clientId, rideToEdit, user]);

    const loadInitialData = async () => {
        setIsLoadingData(true);
        try {
            const promises: Promise<any>[] = [];
            if (!clientId) promises.push(api.get("/clients"));
            promises.push(api.get("/settings/ride-presets"));

            const results = await Promise.all(promises);

            if (!clientId) {
                setClients(results[0].data.clients || []);
                setPresets(results[1].data || []);
            } else {
                setPresets(results[0].data || []);
            }
        } catch (err) {
            console.error("Erro ao carregar dados iniciais do modal", err);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleCreateClient = async () => {
        if (!newClientName) return;
        setIsCreatingClient(true);
        try {
            const { data } = await api.post("/clients", { name: newClientName });
            setClients((prev: Client[]) => [...prev, data]);
            setSelectedClientId(data.id);
            setNewClientName("");
            setIsCreatingClient(false);
            setCurrentStep(2); // Vai para o próximo passo após criar e selecionar
        } catch (err) {
            alert("Erro ao cadastrar cliente. Tente novamente.");
            setIsCreatingClient(false);
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
            return;
        }
        if (!selectedClientId || !value) return;

        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl = photo;

            // Se a foto for um base64 (nova foto), faz o upload primeiro
            if (photo && photo.startsWith('data:image')) {
                try {
                    // Converte base64 de volta para File para o helper de upload
                    const response = await fetch(photo);
                    const blob = await response.blob();
                    const file = new File([blob], "ride-photo.jpg", { type: blob.type });

                    const uploadRes = await uploadImage(file, 'rides');
                    uploadedPhotoUrl = uploadRes.url;
                } catch (uploadErr) {
                    console.error("Falha ao subir imagem para o R2, continuando sem foto...", uploadErr);
                    uploadedPhotoUrl = null; // Não envia base64 se o upload falhar
                }
            }

            const payload = {
                clientId: selectedClientId,
                value: Number(value),
                location: location || "Não informada",
                notes: notes || undefined,
                photo: uploadedPhotoUrl || undefined,
                status,
                paymentStatus,
                rideDate: rideDate || undefined
            };

            if (rideToEdit) {
                await api.patch(`/rides/${rideToEdit.id}`, payload);
            } else {
                await api.post("/rides", payload);
            }

            // Atualiza os dados do usuário globalmente (rideCount)
            await verify();

            if (!rideToEdit) resetForm();
            onSuccess();
            onClose();
        } catch (err) {
            alert(`Erro ao ${rideToEdit ? 'atualizar' : 'registrar'} corrida. Tente novamente.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePresetClick = (preset: any) => {
        setValue(preset.value.toString());
        if (preset.location) {
            setLocation(preset.location);
        } else {
            setLocation("");
        }
        setIsCustomValue(false);
    };

    const resetForm = () => {
        if (!clientId) setSelectedClientId("");
        setValue("");
        setLocation("");
        setNotes("");
        setRideDate("");
        setIsCustomValue(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="bg-slate-900 border-white/10 p-0 overflow-hidden sm:rounded-[2.5rem] w-[calc(100%-2rem)] max-w-lg sm:max-w-[480px] gap-0 shadow-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>{rideToEdit ? 'Editar Corrida' : 'Nova Corrida'}</DialogTitle>
                    <DialogDescription>
                        {rideToEdit ? 'Altere as informações da corrida selecionada.' : 'Registre uma nova corrida no sistema.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Conteúdo do Modal */}
                <div className="flex flex-col max-h-[90vh] sm:max-h-none relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 sm:right-10 sm:top-10 z-20 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all active:scale-95 group border border-white/5 shadow-lg"
                        title="Fechar"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="sm:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 shrink-0" />

                    <div className="px-6 sm:px-10 pt-4 sm:pt-8 pb-4 shrink-0">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 font-black shadow-inner border border-blue-500/10">
                                <Bike size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-none">
                                    {rideToEdit ? 'Editar Corrida' : 'Nova Corrida'}
                                </h2>
                                <p className="text-slate-500 text-[10px] sm:text-xs mt-1.5 uppercase tracking-[0.2em] font-bold opacity-70">
                                    Passo {currentStep} de 5
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "h-1.5 flex-1 rounded-full transition-all duration-500",
                                        s <= currentStep ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" : "bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="overflow-y-auto px-6 sm:px-10 pb-10 custom-scrollbar">
                        <form 
                            onSubmit={handleSubmit} 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
                                    e.preventDefault();
                                }
                            }}
                            className="space-y-6 sm:space-y-8 min-h-[300px] flex flex-col"
                        >
                            <AnimatePresence mode="wait">
                                {currentStep === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 flex-1 flex flex-col"
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                                <User size={12} /> Selecionar Cliente
                                            </label>
                                            <span className="text-[10px] text-slate-600 font-bold">{clients.length} cadastrados</span>
                                        </div>

                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {clients
                                                .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1))
                                                .slice(clientPage * clientsPerPage, (clientPage + 1) * clientsPerPage)
                                                .map((client) => (
                                                    <button
                                                        key={client.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedClientId(client.id);
                                                            setCurrentStep(2);
                                                        }}
                                                        className={cn(
                                                            "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all active:scale-95 border relative group",
                                                            selectedClientId === client.id
                                                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                                                : "bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-900"
                                                        )}
                                                    >
                                                        {client.isPinned && (
                                                            <div className="absolute top-2 right-2 text-amber-500">
                                                                <Star size={10} className="fill-amber-500" />
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center mb-1 text-xs font-black uppercase",
                                                            selectedClientId === client.id ? "bg-white/20" : "bg-slate-800"
                                                        )}>
                                                            {client.name.substring(0, 2)}
                                                        </div>
                                                        <span className="text-[10px] font-bold truncate w-full px-1">{client.name.split(" ")[0]}</span>
                                                    </button>
                                                ))}
                                            <button
                                                type="button"
                                                onClick={() => setIsCreatingClient(true)}
                                                className="aspect-square border border-dashed border-blue-500/30 bg-blue-500/5 rounded-2xl flex flex-col items-center justify-center p-2 group active:bg-blue-500/10 transition-colors"
                                            >
                                                <Plus size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] text-blue-400 mt-1 font-black uppercase tracking-tighter">Novo</span>
                                            </button>
                                        </div>

                                        {/* Pagination for clients if many */}
                                        {clients.length > clientsPerPage && (
                                            <div className="flex items-center justify-center gap-4 mt-auto pt-4">
                                                <button
                                                    type="button"
                                                    disabled={clientPage === 0}
                                                    onClick={() => setClientPage(p => p - 1)}
                                                    className="p-2 text-slate-500 hover:text-white disabled:opacity-20"
                                                >
                                                    <ChevronRight className="rotate-180" size={18} />
                                                </button>
                                                <span className="text-[10px] font-black text-slate-600">{clientPage + 1} / {Math.ceil(clients.length / clientsPerPage)}</span>
                                                <button
                                                    type="button"
                                                    disabled={clientPage >= Math.ceil(clients.length / clientsPerPage) - 1}
                                                    onClick={() => setClientPage(p => p + 1)}
                                                    className="p-2 text-slate-500 hover:text-white disabled:opacity-20"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Inline Client Creation */}
                                        <AnimatePresence>
                                            {isCreatingClient && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 20 }}
                                                    className="fixed inset-x-0 bottom-0 z-[160] p-6 bg-slate-900 border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-black text-white tracking-tight">Novo Cliente</h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCreatingClient(false)}
                                                            className="text-slate-500 hover:text-white p-1"
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
                                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-blue-500 transition-all"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleCreateClient}
                                                            disabled={!newClientName || isLoadingData}
                                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            {isLoadingData ? "CADASTRANDO..." : "CADASTRAR E CONTINUAR"}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}

                                {currentStep === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-3 bg-slate-950/30 p-4 rounded-2xl border border-white/5">
                                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-black uppercase text-xs">
                                                {clients.find(c => c.id === selectedClientId)?.name.substring(0, 2) || "CL"}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Cliente Selecionado</p>
                                                <p className="text-white font-bold">{clients.find(c => c.id === selectedClientId)?.name || clientName || "Cliente"}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                                <DollarSign size={12} /> Valor e Localização
                                            </label>

                                            {(presets.length > 0 || QUICK_VALUES.length > 0) && (
                                                <div className="grid grid-cols-3 gap-2.5">
                                                    {QUICK_VALUES.map((v) => {
                                                        const matchingPreset = presets.find((p: any) => p.value === v);
                                                        const displayItem = matchingPreset || { id: `default-${v}`, value: v, location: "" };
                                                        
                                                        return (
                                                            <button
                                                                key={displayItem.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (matchingPreset) {
                                                                        handlePresetClick(matchingPreset);
                                                                    } else {
                                                                        setValue(String(v));
                                                                        setLocation("");
                                                                        setIsCustomValue(false);
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "p-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all group active:scale-95",
                                                                    value === String(v) && !isCustomValue
                                                                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25"
                                                                        : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-900"
                                                                )}
                                                            >
                                                                <span className="text-base font-black">R$ {v}</span>
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsCustomValue(true);
                                                            setValue("");
                                                            setLocation("");
                                                        }}
                                                        className={cn(
                                                            "p-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all group active:scale-95",
                                                            isCustomValue
                                                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25"
                                                                : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-900"
                                                        )}
                                                    >
                                                        <span className="text-sm font-black">OUTRO</span>
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 px-1">
                                                <Star size={10} className="text-blue-500/50" />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                    Valores e locais fixos podem ser alterados nas <Link href="/dashboard/settings" className="text-blue-500 hover:underline">Configurações</Link>
                                                </p>
                                            </div>

                                            <AnimatePresence>
                                                {value !== "" && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        className="overflow-hidden space-y-4"
                                                    >
                                                        {isCustomValue && (
                                                            <div className="relative group">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-base">R$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={value}
                                                                    onChange={(e) => { setValue(e.target.value); setIsCustomValue(true); }}
                                                                    placeholder="Valor Personalizado"
                                                                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xl font-black focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-800"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="space-y-3">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                                                <MapPin size={12} className="text-blue-500" /> Localização da Corrida
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={location}
                                                                onChange={(e) => setLocation(e.target.value)}
                                                                placeholder="Onde será a corrida? (Ex: Centro, Shopping...)"
                                                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-800"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}
 
                                {currentStep === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                                <DollarSign size={12} /> Status do Pagamento
                                            </label>
                                            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950/50 rounded-[2rem] border border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatus('PENDING')}
                                                    className={cn(
                                                        "py-4 rounded-[1.75rem] text-[11px] font-black transition-all uppercase tracking-widest",
                                                        paymentStatus === 'PENDING' ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-[1.02]" : "text-slate-600 hover:text-slate-400"
                                                    )}
                                                >
                                                    Não Pago
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatus('PAID')}
                                                    className={cn(
                                                        "py-4 rounded-[1.75rem] text-[11px] font-black transition-all uppercase tracking-widest",
                                                        paymentStatus === 'PAID' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]" : "text-slate-600 hover:text-slate-400"
                                                    )}
                                                >
                                                    Pago
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                                <Calendar size={12} className="text-blue-500/50" /> Data e Hora
                                                <span className="text-slate-700 lowercase italic font-medium tracking-normal">(opcional)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={rideDate}
                                                onChange={(e) => setRideDate(e.target.value)}
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold [color-scheme:dark]"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between pl-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <FileText size={12} /> Observações
                                                    <span className="text-slate-700 lowercase italic font-medium tracking-normal">(opcional)</span>
                                                </label>
                                                <label className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-blue-400 cursor-pointer transition-all active:scale-95 group">
                                                    <Camera size={14} className="group-hover:rotate-12 transition-transform" />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">Anexar Foto</span>
                                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                                                </label>
                                            </div>

                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Detalhes extras, referências, etc..."
                                                rows={3}
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-[2rem] py-5 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-slate-800 text-sm font-bold min-h-[120px]"
                                            />

                                            {photo && (
                                                <div className="relative inline-block mt-2">
                                                    <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-2 border-blue-500/30 shadow-2xl group">
                                                        <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setPhoto(null)}
                                                            className="absolute inset-0 bg-red-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                        >
                                                            <Trash2 size={24} />
                                                        </button>
                                                    </div>
                                                    <span className="absolute -top-3 -right-3 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Foto Anexada</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 5 && (
                                    <motion.div
                                        key="step5"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-slate-950/40 border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                                            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Cliente</p>
                                                    <p className="text-white font-bold">{clients.find((c: Client) => c.id === selectedClientId)?.name || clientName}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-2">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Valor</p>
                                                    <p className="text-2xl font-black text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Pagamento</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className={cn(
                                                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                                            paymentStatus === 'PAID' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500"
                                                        )}>{paymentStatus === 'PAID' ? 'Pago' : 'Não Pago'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Localização</p>
                                                <p className="text-sm text-slate-300 font-bold">{location}</p>
                                            </div>

                                            {(rideDate || notes || photo) && (
                                                <div className="pt-4 border-t border-white/5 space-y-4">
                                                    {rideDate && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Data Agendada</p>
                                                            <p className="text-sm text-slate-400 font-medium">{new Date(rideDate).toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                    {notes && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Observações</p>
                                                            <p className="text-sm text-slate-400 italic">"{notes}"</p>
                                                        </div>
                                                    )}
                                                    {photo && (
                                                        <div className="flex items-center gap-2 text-blue-400">
                                                            <Camera size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Foto Anexada</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Form Navigation */}
                            <div className="flex gap-3 mt-auto pt-8">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        className="h-14 px-6 rounded-2xl bg-white/5 border border-white/5 text-slate-400 font-bold hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <ChevronRight size={20} className="rotate-180" />
                                    </button>
                                )}

                                {currentStep < 5 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (currentStep === 1 && !selectedClientId) return;
                                            if (currentStep === 2 && !value) return;
                                            setCurrentStep(prev => prev + 1);
                                        }}
                                        disabled={
                                            (currentStep === 1 && !selectedClientId) ||
                                            (currentStep === 2 && !value)
                                        }
                                        className="flex-1 h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30"
                                    >
                                        {currentStep === 4 ? "REVISAR" : "CONTINUAR"}
                                        <ChevronRight size={20} />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <div className="h-6 w-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                {rideToEdit ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR E REGISTRAR'}
                                                <CheckCircle2 size={24} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
