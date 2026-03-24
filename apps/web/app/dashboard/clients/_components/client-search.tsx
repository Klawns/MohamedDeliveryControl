"use client";

import { Search } from "lucide-react";

interface ClientSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function ClientSearch({ value, onChange }: ClientSearchProps) {
    return (
        <div className="relative group max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary transition-colors text-text-muted">
                <Search size={20} />
            </div>
            <input
                type="text"
                placeholder="Buscar por nome do cliente..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-muted/50 border border-border-subtle rounded-2xl py-4 pl-12 pr-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
            />
        </div>
    );
}
