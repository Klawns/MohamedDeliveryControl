'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { type User } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  CHECKOUT_CTA_HREF,
  getFreeTrialState,
} from '@/services/free-trial-service';
import { type MenuItem } from '../../_hooks/use-sidebar-state';

interface SidebarNavigationProps {
  isOpen: boolean;
  pathname: string;
  menuItems: MenuItem[];
  user: User | null;
  onItemClick: () => void;
}

export function SidebarNavigation({
  isOpen,
  pathname,
  menuItems,
  user,
  onItemClick,
}: SidebarNavigationProps) {
  const showUpgradeCta = isOpen && getFreeTrialState(user).isStarter;

  return (
    <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
      {menuItems.map((item) => (
        item.disabled ? (
          <div
            key={item.label}
            className={cn(
              'flex items-center gap-4 px-4 py-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 opacity-60 cursor-not-allowed',
              !isOpen &&
                'lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:rounded-2xl lg:px-0 lg:py-0',
            )}
            title={!isOpen ? `${item.label} bloqueado` : ''}
          >
            <item.icon
              size={22}
              className={cn('shrink-0 transition-all duration-300', item.color)}
            />
            {isOpen && (
              <>
                <span className="font-medium text-sidebar-foreground-muted">
                  {item.label}
                </span>
                <Lock size={14} className="ml-auto text-sidebar-foreground-muted" />
              </>
            )}
          </div>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-sidebar-accent/50 transition-all group active:scale-95 border border-transparent',
              pathname === item.href &&
                'bg-sidebar-accent-active text-sidebar-foreground-primary shadow-sm border-sidebar-border-active',
              !isOpen &&
                'lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:rounded-2xl lg:px-0 lg:py-0',
            )}
            title={!isOpen ? item.label : ''}
          >
            <item.icon
              size={22}
              className={cn(
                'shrink-0 transition-all duration-300',
                item.color,
                pathname === item.href
                  ? 'brightness-110 saturate-125 scale-110'
                  : 'opacity-60 group-hover:opacity-100 group-hover:scale-105 saturate-[0.8]',
              )}
            />
            {isOpen && (
              <span
                className={cn(
                  'font-medium transition-colors',
                  pathname === item.href
                    ? 'text-sidebar-foreground-primary'
                    : 'text-sidebar-foreground-muted group-hover:text-sidebar-foreground',
                )}
              >
                {item.label}
              </span>
            )}
          </Link>
        )
      ))}

      {showUpgradeCta && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link
            href={CHECKOUT_CTA_HREF}
            onClick={onItemClick}
            className="mx-4 mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-button-primary text-button-primary-foreground font-black text-xs uppercase tracking-widest hover:bg-button-primary-hover transition-all shadow-lg shadow-button-shadow active:scale-95 group"
          >
            <Sparkles
              size={14}
              className="group-hover:rotate-12 transition-transform"
            />
            Fazer Upgrade
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
