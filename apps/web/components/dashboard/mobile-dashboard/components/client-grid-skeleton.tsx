"use client";

import { motion } from "framer-motion";

export function ClientGridSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
                <div 
                    key={i}
                    className="aspect-square bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-3 animate-pulse"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-800 mb-2" />
                    <div className="h-2 w-12 bg-slate-800 rounded" />
                </div>
            ))}
        </div>
    );
}
