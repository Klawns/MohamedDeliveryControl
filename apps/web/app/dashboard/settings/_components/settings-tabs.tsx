"use client";

import { DatabaseBackup, Settings2, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
    const tabs = [
        { id: "general", label: "Geral", icon: Settings2 },
        { id: "backups", label: "Backups", icon: DatabaseBackup },
        { id: "danger", label: "Limpeza de Dados", icon: ShieldAlert, variant: "danger" },
    ];

    return (
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-card-background border border-border-subtle rounded-[2rem] shadow-lg w-full md:w-fit backdrop-blur-sm overflow-hidden">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDanger = tab.variant === "danger";

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex-1 md:flex-initial flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-display font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all relative overflow-hidden group whitespace-nowrap",
                            isActive
                                ? (isDanger
                                    ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20")
                                : "text-text-muted hover:text-text-primary hover:bg-hover-accent"
                        )}
                    >
                        <Icon
                            size={14}
                            strokeWidth={isActive ? 3 : 2.5}
                            className={cn(
                                "transition-transform group-hover:scale-110 shrink-0",
                                !isActive && (isDanger ? "text-destructive" : "text-primary"),
                                "sm:w-4 sm:h-4 w-3.5 h-3.5"
                            )}
                        />

                        <span className="truncate">
                            {tab.id === "danger" ? (
                                <>
                                    <span className="hidden sm:inline">Limpeza de Dados</span>
                                    <span className="sm:hidden">Limpar</span>
                                </>
                            ) : tab.label}
                        </span>

                        {isActive && (
                            <div className="absolute inset-0 bg-white/10 mix-blend-overlay animate-pulse" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
