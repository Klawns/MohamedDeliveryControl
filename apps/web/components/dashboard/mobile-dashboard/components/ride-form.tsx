"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Star, Calendar, FileText, Camera, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RidePreset, PaymentStatus } from "../types";
import { QUICK_VALUES } from "../constants";

interface RideFormProps {
    presets: RidePreset[];
    selectedPresetId: string | null;
    onSelectPreset: (id: string, value: number, location?: string) => void;
    onDeletePreset: (id: string) => void;
    customValue: string;
    setCustomValue: (val: string) => void;
    customLocation: string;
    setCustomLocation: (loc: string) => void;
    showCustomForm: boolean;
    setShowCustomForm: (show: boolean) => void;
    paymentStatus: PaymentStatus;
    setPaymentStatus: (status: PaymentStatus) => void;
    rideDate: string;
    setRideDate: (date: string) => void;
    notes: string;
    setNotes: (notes: string) => void;
    photo: string | null;
    onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemovePhoto: () => void;
    isSaving: boolean;
    onSubmit: () => void;
    canSubmit: boolean;
}

export function RideForm({
    presets,
    selectedPresetId,
    onSelectPreset,
    onDeletePreset,
    customValue,
    setCustomValue,
    customLocation,
    setCustomLocation,
    showCustomForm,
    setShowCustomForm,
    paymentStatus,
    setPaymentStatus,
    rideDate,
    setRideDate,
    notes,
    setNotes,
    photo,
    onPhotoChange,
    onRemovePhoto,
    isSaving,
    onSubmit,
    canSubmit
}: RideFormProps) {
    return (
        <motion.section 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }} 
            className="space-y-4"
        >
            <div className="bg-card-background rounded-2xl border border-border-subtle p-3 shadow-sm">
                <p className="text-[10px] text-text-muted uppercase font-display font-bold mb-2">Status do Pagamento</p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPaymentStatus('PENDING')} 
                        className={cn(
                            "flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest", 
                            paymentStatus === 'PENDING' ? "bg-warning text-white shadow-lg shadow-warning/20" : "bg-muted/50 text-text-muted"
                        )}
                    >
                        Pendente
                    </button>
                    <button 
                        onClick={() => setPaymentStatus('PAID')} 
                        className={cn(
                            "flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest", 
                            paymentStatus === 'PAID' ? "bg-success text-success-foreground shadow-lg shadow-success/20" : "bg-muted/50 text-text-muted"
                        )}
                    >
                        Pago
                    </button>
                </div>
            </div>
            <div className="bg-card-background rounded-[2rem] border border-border-subtle p-5 sm:p-6 shadow-lg">
                <h2 className="text-sm font-display font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-2 mb-5">
                    <MapPin size={16} className="text-primary" /> Valor e Local
                </h2>
                
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                    {QUICK_VALUES.map((v) => {
                        const matchingPreset = presets.find((p) => p.value === v);
                        const displayId = matchingPreset?.id || `default-${v}`;
                        const isSelected = (!showCustomForm && (selectedPresetId === displayId || (customValue === String(v) && !selectedPresetId)));

                        return (
                            <div key={displayId} className="relative group/preset">
                                <button
                                    onClick={() => {
                                        onSelectPreset(displayId, v, matchingPreset?.location);
                                        setShowCustomForm(false);
                                    }}
                                    className={cn(
                                        "w-full aspect-square rounded-2xl p-2 text-center border transition-all flex flex-col justify-center items-center shadow-sm active:scale-95",
                                        isSelected 
                                            ? "bg-primary border-primary shadow-lg shadow-primary/25" 
                                            : "bg-muted/50 border-border-subtle hover:bg-hover-accent"
                                    )}
                                >
                                    <div className={cn("text-lg font-display font-extrabold tracking-tighter", isSelected ? "text-primary-foreground" : "text-primary")}>
                                        R$ {v}
                                    </div>
                                </button>
                                {matchingPreset && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePreset(matchingPreset.id);
                                        }}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all opacity-0 group-hover/preset:opacity-100"
                                    >
                                        <Trash2 size={10} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <button 
                        onClick={() => {
                            setShowCustomForm(!showCustomForm);
                            if (!showCustomForm) {
                                setCustomValue("");
                            }
                        }} 
                        className={cn(
                            "aspect-square rounded-2xl p-2 text-left border transition-all flex flex-col justify-center items-center active:scale-95", 
                            showCustomForm ? "bg-primary/20 border-primary text-primary" : "bg-accent/50 border-border text-muted-foreground hover:bg-accent"
                        )}
                    >
                        <Plus size={18} />
                        <span className="text-[10px] font-display font-bold uppercase mt-1">Outro</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 px-1 mb-2">
                    <Star size={10} className="text-primary/50 underline" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter leading-tight">
                        Configure locais fixos em <Link href="/dashboard/settings" className="text-primary hover:underline">Ajustes</Link>
                    </p>
                </div>

                <AnimatePresence>
                    {(selectedPresetId || showCustomForm) && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-4 pt-4 overflow-hidden"
                        >
                            {showCustomForm && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Valor Personalizado</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-base">R$</span>
                                        <input 
                                            type="number" 
                                            value={customValue} 
                                            onChange={e => setCustomValue(e.target.value)} 
                                            placeholder="0,00" 
                                            className="w-full bg-background border border-border-subtle rounded-2xl pl-12 pr-4 py-4 text-text-primary text-xl font-display font-extrabold outline-none focus:border-primary/50 shadow-inner" 
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">Localização da Corrida</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={customLocation} 
                                        onChange={e => setCustomLocation(e.target.value)} 
                                        placeholder="Destino ou Ponto de Partida" 
                                        className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-foreground text-sm font-bold outline-none focus:border-primary/50 shadow-inner" 
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {customValue && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="overflow-hidden space-y-4"
                    >
                        {/* Opcionais Card */}
                        <div className="bg-card-background rounded-[2rem] border border-border-subtle p-5 sm:p-6 space-y-5 shadow-lg">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[11px] font-display font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Calendar size={14} className="text-primary/50" /> Detalhes Opcionais
                                </h3>
                                <label className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-primary cursor-pointer active:scale-95 transition-all text-[10px] font-bold uppercase tracking-tight">
                                    <Camera size={14} />
                                    <span className="hidden sm:inline">Foto</span>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoChange} />
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="datetime-local"
                                        value={rideDate}
                                        onChange={(e) => setRideDate(e.target.value)}
                                        className="w-full bg-background/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all [color-scheme:dark]"
                                    />
                                </div>

                                <AnimatePresence>
                                    {rideDate && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="relative group">
                                                <FileText className="absolute left-4 top-4 text-primary/30 group-focus-within:text-primary transition-colors" size={16} />
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Observações suplementares..."
                                                    rows={2}
                                                    className="w-full bg-background/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30 resize-none transition-all placeholder:text-muted-foreground/30"
                                                />
                                            </div>

                                            {photo && (
                                                <div className="relative inline-block group/photo">
                                                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-primary/30 shadow-lg">
                                                        <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={onRemovePhoto}
                                                            className="absolute inset-0 bg-destructive/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <Button
                            className={cn(
                                "w-full text-primary-foreground font-display font-bold h-16 rounded-[2rem] shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-sm uppercase tracking-widest",
                                paymentStatus === 'PAID' ? "bg-success hover:bg-success/90 shadow-success/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                            )}
                            onClick={onSubmit}
                            disabled={isSaving || !canSubmit}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> 
                                    Processando
                                </span>
                            ) : (
                                <><Save size={20} /> SALVAR CORRIDA</>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
}
