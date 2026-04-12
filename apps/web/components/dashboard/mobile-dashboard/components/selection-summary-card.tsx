"use client";

import type { LucideIcon } from "lucide-react";

interface SelectionSummaryCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
    actionLabel?: string;
    ariaLabel?: string;
}

export function SelectionSummaryCard({
    title,
    description,
    icon: Icon,
    onClick,
    actionLabel = "Trocar",
    ariaLabel,
}: SelectionSummaryCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className="group animate-in slide-in-from-top-2 flex w-full items-start justify-between rounded-2xl border border-primary/20 bg-primary/10 p-5 text-left shadow-lg shadow-primary/5 transition-all active:scale-[0.99] fade-in"
        >
            <div className="min-w-0 flex-1">
                <h3 className="min-w-0 text-xl font-display font-extrabold uppercase tracking-tighter text-text-primary">
                    {title}
                </h3>
                <p className="mt-1 text-[10px] font-display font-bold uppercase tracking-widest text-primary opacity-80">
                    {description}
                </p>
            </div>

            <div className="ml-4 flex shrink-0 flex-col items-end gap-3">
                <span className="text-xs font-medium text-primary">{actionLabel}</span>
                <div className="rounded-xl bg-primary/20 p-2 transition-transform group-active:scale-95">
                    <Icon size={20} className="text-primary" />
                </div>
            </div>
        </button>
    );
}
