import { AnimatePresence, motion } from "framer-motion";
import { Info, LayoutGrid, Plus } from "lucide-react";
import { RidePresetCard } from "./ride-preset-card";

interface RidePresetListProps {
    presets: any[];
    isLoading: boolean;
    onEdit: (preset: any) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
}

export function RidePresetList({ presets, isLoading, onEdit, onDelete, onAdd }: RidePresetListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-slate-900/40 animate-pulse rounded-[2rem] border border-white/5" />
                ))}
            </div>
        );
    }

    if (presets.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 bg-card-background/50 rounded-[3rem] border-2 border-dashed border-border-subtle hover:border-primary/40 transition-colors group cursor-pointer"
                onClick={onAdd}
            >
                <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-2xl mb-4 border border-border-subtle shadow-inner group-hover:scale-110 transition-transform">
                    <LayoutGrid className="text-text-muted group-hover:text-primary transition-colors" size={32} />
                </div>
                <h4 className="text-text-primary font-black mb-1 text-lg tracking-tight">Você ainda não configurou atalhos</h4>
                <p className="text-text-muted text-sm max-w-[280px] text-center font-medium mb-6">
                    Seus atalhos facilitam o preenchimento de corridas no dia a dia.
                </p>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm uppercase tracking-widest"
                >
                    <Plus size={18} strokeWidth={3} />
                    Adicionar atalho
                </button>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
                {presets.map((preset) => (
                    <RidePresetCard
                        key={preset.id}
                        preset={preset}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
