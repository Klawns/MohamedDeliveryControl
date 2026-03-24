"use client";

import { motion } from "framer-motion";

export function RideSkeleton() {
    return (
        <div className="glass-card p-5 rounded-[2.5rem] border border-white/5 bg-slate-900/40 animate-pulse flex flex-col gap-6 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-4 bg-white/5 rounded-2xl w-[56px] h-[56px] flex-shrink-0" />

                    <div className="flex-1 min-w-0 space-y-2 pt-1">
                        <div className="h-5 bg-white/5 rounded-lg w-1/2" />
                        <div className="h-3 bg-white/5 rounded-md w-1/3" />
                    </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0 space-y-2">
                    <div className="h-7 w-20 bg-white/5 rounded-lg" />
                    <div className="h-3 w-12 bg-white/5 rounded-md" />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                    <div className="h-4 w-24 bg-white/5 rounded-md" />
                    <div className="h-7 w-32 bg-white/5 rounded-xl hidden sm:block" />
                </div>

                <div className="flex items-center justify-end gap-2">
                    <div className="h-10 w-24 bg-white/5 rounded-xl" />
                    <div className="h-10 w-10 bg-white/5 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
