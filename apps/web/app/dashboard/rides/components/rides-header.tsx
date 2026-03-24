"use client";

import { Plus } from "lucide-react";

interface RidesHeaderProps {
    onNewRide: () => void;
}

export function RidesHeader({ onNewRide }: RidesHeaderProps) {
    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h1 className="text-3xl font-display font-extrabold text-text-primary tracking-tight">Histórico de Corridas</h1>
                <p className="text-text-secondary mt-1 font-medium opacity-80">Veja todas as suas atividades e faturamento histórico.</p>
            </div>
            <button
                onClick={onNewRide}
                className="flex items-center gap-2 bg-button-primary hover:bg-button-primary-hover text-button-primary-foreground px-6 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-button-shadow active:scale-95 uppercase tracking-widest text-xs"
            >
                <Plus size={20} strokeWidth={3} />
                Nova Corrida
            </button>
        </header>
    );
}
