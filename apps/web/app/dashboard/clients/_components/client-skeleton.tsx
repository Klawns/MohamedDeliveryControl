"use client";

import { motion } from "framer-motion";

export function ClientSkeleton() {
    return (
        <div className="p-5 rounded-[2.5rem] border border-border-subtle bg-muted/20 animate-pulse relative overflow-hidden shadow-sm">
            <div className="flex flex-col gap-5 relative z-10">
                <div className="flex items-start gap-4">
                    {/* Icone Skeleton */}
                    <div className="flex-shrink-0 w-14 h-14 bg-muted/40 rounded-2xl" />

                    <div className="flex-1 min-w-0 pt-1 space-y-2">
                        <div className="h-6 bg-muted/40 rounded-lg w-3/4" />
                        <div className="h-4 bg-muted/40 rounded-md w-1/2" />
                    </div>
                </div>

                {/* Barra de Ações Skeleton */}
                <div className="flex items-center justify-between bg-muted/20 p-2 rounded-2xl border border-border-subtle">
                    <div className="flex items-center gap-2">
                        <div className="h-11 w-11 bg-muted/40 rounded-xl" />
                        <div className="h-11 w-11 bg-muted/40 rounded-xl" />
                        <div className="h-11 w-11 bg-muted/40 rounded-xl" />
                    </div>
                    <div className="h-6 w-6 bg-muted/40 rounded-full mr-2" />
                </div>
            </div>
        </div>
    );
}
