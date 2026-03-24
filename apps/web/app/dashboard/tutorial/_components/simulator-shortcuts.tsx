"use client";

import { useState } from "react";
import { DollarSign, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Preset {
    label: string;
    value: number;
}

interface SimulatorShortcutsProps {
    presets: Preset[];
    onAdd: (preset: Preset) => void;
}

export function SimulatorShortcuts({ presets, onAdd }: SimulatorShortcutsProps) {
    const [newVal, setNewVal] = useState("");
    const [newLoc, setNewLoc] = useState("");

    const handleAdd = () => {
        if (newVal && newLoc) {
            onAdd({ label: newLoc.toUpperCase(), value: Number(newVal) });
            setNewVal("");
            setNewLoc("");
        }
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-5 md:p-6 shadow-2xl space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                    <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Configurar Novo Atalho</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-3 md:top-3.5 text-slate-500" />
                            <Input
                                type="number"
                                value={newVal}
                                onChange={e => setNewVal(e.target.value)}
                                placeholder="Valor"
                                className="bg-slate-950 border-white/10 pl-8 h-10 md:h-12 rounded-xl text-xs md:text-sm"
                            />
                        </div>
                        <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-3 md:top-3.5 text-slate-500" />
                            <Input
                                value={newLoc}
                                onChange={e => setNewLoc(e.target.value)}
                                placeholder="Local"
                                className="bg-slate-950 border-white/10 pl-8 h-10 md:h-12 rounded-xl text-xs md:text-sm"
                            />
                        </div>
                    </div>
                    <Button onClick={handleAdd} className="w-full h-10 md:h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-600/20 text-xs md:text-sm">
                        Adicionar Atalho <Plus className="ml-1 md:ml-2" size={14} />
                    </Button>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                    <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Sua Barra de Atalhos</h4>
                    <div className="flex flex-wrap gap-2">
                        {presets.map((p) => (
                            <div key={p.label} className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                                <span className="text-xs md:text-sm font-black text-white">R$ {p.value}</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">{p.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
