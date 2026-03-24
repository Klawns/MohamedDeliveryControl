"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Preset {
    label: string;
    value: number;
}

interface Client {
    name: string;
}

interface SimulatorRideFormProps {
    client: Client;
    presets: Preset[];
    onComplete: () => void;
}

export function SimulatorRideForm({ client, presets, onComplete }: SimulatorRideFormProps) {
    const [val, setVal] = useState<number | null>(null);
    const [notes, setNotes] = useState("");
    const [tempPhoto, setTempPhoto] = useState<string | null>(null);

    const handleSimulatedPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTempPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="p-3 md:p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl md:rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {client.name?.charAt(0) ?? "?"}
                </div>
                <div>
                    <p className="text-[9px] md:text-xs text-blue-400 font-bold uppercase tracking-widest">Cliente Ativo</p>
                    <p className="text-white font-black text-sm md:text-base leading-none">{client.name || "Sem nome"}</p>
                </div>
            </div>

            <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Preço da Corrida</label>
                <div className="grid grid-cols-3 gap-2">
                    {presets.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => setVal(p.value)}
                            className={cn(
                                "h-12 md:h-14 rounded-xl font-black text-xs md:text-sm transition-all border",
                                val === p.value
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                    : "bg-slate-800 border-white/5 text-slate-400 hover:border-white/20"
                            )}
                        >
                            R$ {p.value}
                            <span className="block text-[7px] md:text-[8px] opacity-60 font-medium truncate">{p.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Obs & Foto <span className="lowercase italic opacity-50 font-medium">(opcional)</span></label>
                    <label className="flex items-center gap-1.5 px-2 py-1 bg-blue-600/10 rounded-lg text-blue-400 cursor-pointer text-[9px] font-black uppercase md:text-[10px]">
                        <Camera size={12} /> Foto
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSimulatedPhoto} />
                    </label>
                </div>

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Deixado na garagem..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-xs min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />

                <AnimatePresence>
                    {tempPhoto && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-blue-500/30">
                            <img src={tempPhoto} alt="Preview" className="w-full h-full object-cover" />
                            <button onClick={() => setTempPhoto(null)} className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Trash2 size={16} className="text-white" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Button
                disabled={!val}
                onClick={onComplete}
                className="w-full h-12 md:h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-xl md:rounded-2xl shadow-lg shadow-primary/20 text-base md:text-lg transition-all active:scale-95"
            >
                Finalizar Registro <Zap className="ml-2 fill-current" size={18} />
            </Button>
        </div>
    );
}
