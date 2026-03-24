import { motion } from "framer-motion";
import { MapPin, Pencil, Trash2, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RidePresetCardProps {
    preset: any;
    onEdit: (preset: any) => void;
    onDelete: (id: string) => void;
}

export function RidePresetCard({ preset, onEdit, onDelete }: RidePresetCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-card-background border border-border-subtle rounded-3xl p-5 hover:bg-hover-accent transition-all duration-300 overflow-hidden shadow-sm"
        >
            {/* Background Decorative Element */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/10">
                        <Tag size={12} className="text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Atalho</span>
                    </div>
                    
                    <div className="space-y-1">
                        <h4 className="text-3xl font-display font-extrabold text-text-primary tracking-tighter">
                            {formatCurrency(preset.value)}
                        </h4>
                        <div className="flex items-center gap-2 text-text-muted">
                            <MapPin size={14} className="text-primary/50" />
                            <span className="text-xs font-bold uppercase tracking-wide truncate max-w-[150px]">
                                {preset.location}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(preset)}
                        className="p-3 text-text-muted bg-secondary/10 hover:bg-primary/20 hover:text-primary rounded-2xl transition-all border border-border-subtle hover:border-primary/20 active:scale-90"
                        title="Editar"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(preset.id);
                        }}
                        className="p-3 text-text-muted bg-secondary/10 hover:bg-destructive/20 hover:text-destructive rounded-2xl transition-all border border-border-subtle hover:border-destructive/20 active:scale-90"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
