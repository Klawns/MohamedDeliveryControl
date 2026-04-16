'use client';

import type { CSSProperties } from 'react';

interface SelectionActionBarMobileProps {
  isAllVisibleSelected: boolean;
  hasSelection: boolean;
  isDeleting: boolean;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  onCancel: () => void;
  className?: string;
  style?: CSSProperties;
}

export function SelectionActionBarMobile({
  isAllVisibleSelected,
  hasSelection,
  isDeleting,
  onToggleSelectAll,
  onDeleteSelected,
  onCancel,
  className,
  style,
}: SelectionActionBarMobileProps) {
  return (
    <div
      className={className}
      style={style}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="inline-flex min-w-0 flex-1 items-center justify-center rounded-2xl border border-border-subtle bg-secondary/10 px-3 py-3 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary"
        >
          {isAllVisibleSelected ? 'Desmarcar' : 'Selecionar todas'}
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelection || isDeleting}
          className="inline-flex min-w-0 flex-1 items-center justify-center rounded-2xl border border-blue-500/15 bg-blue-500 px-3 py-3 text-xs font-semibold text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? 'Excluindo...' : 'Excluir'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-2xl border border-border-subtle bg-secondary/10 px-3 py-3 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
