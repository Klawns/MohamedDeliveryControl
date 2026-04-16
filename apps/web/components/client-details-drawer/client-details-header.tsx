"use client";

import { Star, User, X } from "lucide-react";
import { type Client } from "@/types/rides";

interface ClientDetailsHeaderProps {
  client: Client;
  onClose: () => void;
}

export function ClientDetailsHeader({
  client,
  onClose,
}: ClientDetailsHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-icon-info/10 bg-icon-info/10 text-icon-info shadow-inner">
          <User size={22} />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-bold tracking-tight text-text-primary lg:text-3xl">
              {client.name}
            </h2>
            {client.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full border border-icon-warning/20 bg-icon-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-icon-warning">
                <Star size={12} className="fill-current" />
                Fixado
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="rounded-xl border border-transparent p-2 text-text-secondary transition-colors hover:border-border-subtle hover:bg-secondary/10 hover:text-text-primary active:scale-95"
        aria-label="Fechar detalhes do cliente"
      >
        <X size={24} />
      </button>
    </header>
  );
}
