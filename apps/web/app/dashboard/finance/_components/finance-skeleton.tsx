"use client";

import { motion } from "framer-motion";

export function FinanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 bg-white/5 rounded-[3rem] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-96 bg-white/5 rounded-[2.5rem] animate-pulse" />
        <div className="h-96 bg-white/5 rounded-[2.5rem] animate-pulse" />
      </div>
      <div className="h-96 bg-white/5 rounded-[2.5rem] animate-pulse" />
    </div>
  );
}
