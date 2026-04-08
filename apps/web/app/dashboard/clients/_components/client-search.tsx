'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ClientSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClientSearch({ value, onChange }: ClientSearchProps) {
  return (
    <section className="rounded-[1.9rem] border border-border-subtle bg-background/90 p-4 shadow-sm backdrop-blur-sm">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
        />

        <Input
          type="text"
          placeholder="Buscar por nome do cliente"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-2xl border-border-subtle bg-card-background pl-11 pr-12 text-sm font-medium text-text-primary shadow-none"
        />

        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-hover-accent hover:text-text-primary"
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
