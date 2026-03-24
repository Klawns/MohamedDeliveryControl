"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, FileText, Camera, Trash2 } from "lucide-react";

interface StepExtraInfoProps {
    rideDate: string;
    setRideDate: (d: string) => void;
    notes: string;
    setNotes: (n: string) => void;
    photo: string | null;
    setPhoto: (p: string | null) => void;
    handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function StepExtraInfo({
    rideDate,
    setRideDate,
    notes,
    setNotes,
    photo,
    setPhoto,
    handlePhotoChange
}: StepExtraInfoProps) {
    return (
        <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-4">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                    <Calendar size={12} /> Detalhes Opcionais
                </label>

                {/* Opcionais Card */}
                <div className="bg-secondary/10 rounded-[2.5rem] border border-border-subtle p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-icon-info/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    
                    <div className="flex items-center justify-between px-1 relative z-10">
                        <div className="flex flex-col">
                            <h4 className="text-text-primary font-display font-extrabold text-sm tracking-tight">Informações Adicionais</h4>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5 opacity-70">Complemente o registro da corrida</p>
                        </div>
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-icon-info/10 hover:bg-icon-info/20 border border-icon-info/20 rounded-2xl text-icon-info cursor-pointer transition-all active:scale-95 group shadow-sm">
                            <Camera size={16} className="group-hover:rotate-12 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Anexar Foto</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest sm:hidden">Foto</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                                onChange={handlePhotoChange} 
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 gap-5 relative z-10">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Data e Hora da Corrida</label>
                            <div className="relative group">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-icon-info/50 group-focus-within:text-icon-info transition-colors" size={18} />
                                <input
                                    type="datetime-local"
                                    value={rideDate}
                                    onChange={(e) => setRideDate(e.target.value)}
                                    className="w-full bg-secondary/20 border border-border-subtle rounded-2xl py-4 pl-14 pr-5 text-sm text-text-primary focus:outline-none focus:border-icon-info/50 transition-all font-bold [color-scheme:dark] shadow-inner"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {(rideDate || notes || photo) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-5 overflow-hidden pt-2"
                                >
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Observações suplementares</label>
                                        <div className="relative group">
                                            <FileText className="absolute left-5 top-5 text-icon-info/50 group-focus-within:text-icon-info transition-colors" size={18} />
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Notas sobre a corrida..."
                                                rows={2}
                                                className="w-full bg-secondary/20 border border-border-subtle rounded-2xl py-4 pl-14 pr-5 text-sm text-text-primary focus:outline-none focus:border-icon-info/50 transition-all resize-none placeholder:text-text-secondary/30 font-bold shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {photo && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative pt-4"
                                        >
                                            <div className="relative w-full aspect-video rounded-[1.75rem] overflow-hidden border border-icon-info/30 group shadow-lg">
                                                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPhoto(null)}
                                                        className="w-12 h-12 bg-button-destructive hover:bg-button-destructive-hover rounded-2xl flex items-center justify-center text-button-destructive-foreground transition-all active:scale-90 shadow-xl"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
