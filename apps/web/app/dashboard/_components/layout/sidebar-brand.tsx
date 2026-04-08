'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SidebarBrandProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function SidebarBrand({
  isOpen,
  onToggle,
  onClose,
}: SidebarBrandProps) {
  return (
    <div
      className={cn(
        'mb-8 flex h-12 items-center overflow-hidden',
        isOpen ? 'justify-between' : 'justify-center',
      )}
    >
      <AnimatePresence mode="wait">
        {isOpen && (
          <Link
            href="/dashboard"
            aria-label="Ir para o Dashboard"
            className="flex items-center gap-3 shrink-0 active:scale-95 transition-transform"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src="/assets/logo8.jpg"
                  alt="Rotta Logo"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tighter uppercase whitespace-nowrap italic text-text-primary">
                Rotta App
              </span>
            </motion.div>
          </Link>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={cn(
            'hidden lg:flex p-2 hover:bg-sidebar-accent rounded-xl transition-all text-sidebar-foreground-muted hover:text-sidebar-foreground bg-sidebar-accent/50 active:scale-90 border border-transparent hover:border-sidebar-border',
            !isOpen && 'flex rounded-2xl p-2.5',
          )}
          aria-label={isOpen ? 'Recolher Sidebar' : 'Expandir Sidebar'}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <button
          onClick={onClose}
          className="lg:hidden p-2.5 bg-icon-destructive/10 text-icon-destructive hover:bg-icon-destructive hover:text-white rounded-xl transition-all active:scale-95 border border-icon-destructive/10"
          aria-label="Fechar Menu"
        >
          <X size={22} />
        </button>
      </div>
    </div>
  );
}
