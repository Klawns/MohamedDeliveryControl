import { useState } from "react";
import { DollarSign, MapPin, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RidePresetFormProps {
    onAdd: (preset: { value: string; location: string }) => Promise<boolean>;
    isSaving: boolean;
}

export function RidePresetForm({ onAdd, isSaving }: RidePresetFormProps) {
    const [newPreset, setNewPreset] = useState({
        value: "",
        location: ""
    });

    const handleSubmit = async () => {
        if (!newPreset.value || !newPreset.location) return;
        const success = await onAdd(newPreset);
        if (success) {
            setNewPreset({ value: "", location: "" });
        }
    };

    return (
        <div className="relative overflow-hidden bg-card-background rounded-[2.5rem] p-8 border border-border-subtle shadow-2xl">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-display font-extrabold text-text-primary flex items-center gap-2">
                            <Plus size={20} className="text-primary" />
                            Novo Atalho
                        </h3>
                        <p className="text-xs text-text-muted font-medium">Configure um valor e local para acesso rápido.</p>
                    </div>
                    <Sparkles size={20} className="text-primary/20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                        <label className="text-[10px] font-display font-bold text-text-muted uppercase tracking-[0.2em] ml-1">
                            Valor da Corrida
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-focus-within:bg-primary group-focus-within:text-white transition-all">
                                <DollarSign size={16} />
                            </div>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newPreset.value}
                                onChange={e => setNewPreset(prev => ({ ...prev, value: e.target.value }))}
                                className="w-full bg-muted border border-border-subtle rounded-2xl pl-16 pr-4 py-4 text-text-primary text-xl font-display font-extrabold focus:border-primary/50 outline-none transition-all placeholder:text-text-muted/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[10px] font-display font-bold text-text-muted uppercase tracking-[0.2em] ml-1">
                            Localização (Exibição)
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted rounded-xl flex items-center justify-center text-text-muted group-focus-within:bg-primary group-focus-within:text-white transition-all">
                                <MapPin size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Ex: Centro, Hospital, etc."
                                value={newPreset.location}
                                onChange={e => setNewPreset(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full bg-muted border border-border-subtle rounded-2xl pl-16 pr-4 py-4 text-text-primary text-sm font-bold focus:border-primary/50 outline-none transition-all placeholder:text-text-muted/30"
                            />
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={isSaving || !newPreset.value || !newPreset.location}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-text-muted text-primary-foreground font-display font-bold h-14 rounded-2xl mt-2 shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                        <>
                            <Plus size={18} strokeWidth={3} />
                            Adicionar à Grid de Atalhos
                        </>
                    )}
                </Button>
            </div>
        </div>
);
}
