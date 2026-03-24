"use client";

import { motion } from "framer-motion";

export function RideListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-3 w-full">
            {Array.from({ length: count }).map((_, i) => (
                <div 
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 h-[76px] animate-pulse"
                >
                    <div className="flex items-center gap-3 w-2/3">
                        <div className="w-8 h-8 rounded-xl bg-white/5" />
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="h-3 w-24 bg-white/5 rounded" />
                            <div className="h-2 w-32 bg-white/5 rounded" />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="h-4 w-16 bg-white/5 rounded" />
                        <div className="h-4 w-12 bg-white/5 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
