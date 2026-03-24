"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface SettingsTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
}

export function SettingsTabs({ tabs, activeTab, onChange }: SettingsTabsProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-accent/50 border border-border rounded-2xl w-fit">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 outline-none",
                            isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        
                        <span className="relative z-10 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                            {tab.icon && <span className={cn("transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground")}>{tab.icon}</span>}
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
