'use client';

import { LogOut } from 'lucide-react';
import { type User } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface SidebarFooterProps {
  isOpen: boolean;
  user: User | null;
  onLogout: () => void;
}

export function SidebarFooter({
  isOpen,
  user,
  onLogout,
}: SidebarFooterProps) {
  return (
    <div
      className={cn(
        'mt-auto border-t border-sidebar-border pt-6',
        !isOpen && 'px-1',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 mb-4',
          !isOpen && 'lg:justify-center lg:px-0',
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-icon-brand/20 bg-icon-brand/10 text-sm font-bold text-icon-brand transition-colors',
            !isOpen && 'lg:h-11 lg:w-11',
          )}
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <p className="font-semibold truncate text-text-primary">
              {user?.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-sidebar-foreground-muted truncate leading-none font-medium">
                {user?.email}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onLogout}
        className={cn(
          'w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-icon-destructive/10 text-sidebar-foreground-muted hover:text-icon-destructive transition-all group active:scale-95',
          !isOpen &&
            'lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:rounded-2xl lg:px-0 lg:py-0',
        )}
        title={!isOpen ? 'Sair' : ''}
      >
        <LogOut
          size={20}
          className="shrink-0 group-hover:-translate-x-1 transition-transform"
        />
        {isOpen && <span className="font-medium">Sair</span>}
      </button>
    </div>
  );
}
