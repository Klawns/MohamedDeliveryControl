'use client';

interface SelectionContextBarProps {
  selectedCount: number;
  totalVisible: number;
  onCancel: () => void;
  onToggleSelectAll: () => void;
  isAllVisibleSelected: boolean;
  onDeleteSelected: () => void;
  isDeleting: boolean;
  hideInlineActions?: boolean;
  selectionLabel?: string;
  summaryLabel?: string;
}

export function SelectionContextBar({
  selectedCount,
  totalVisible,
  onCancel,
  onToggleSelectAll,
  isAllVisibleSelected,
  onDeleteSelected,
  isDeleting,
  hideInlineActions = false,
  selectionLabel,
  summaryLabel,
}: SelectionContextBarProps) {
  const selectAllLabel = isAllVisibleSelected
    ? 'Desmarcar todas'
    : 'Selecionar todas';
  const selectionCountLabel =
    selectionLabel ??
    (selectedCount === 1
      ? '1 corrida selecionada'
      : `${selectedCount} corridas selecionadas`);
  const visibilityLabel =
    summaryLabel ??
    (selectedCount > 0
      ? `${selectedCount} de ${totalVisible} carregadas`
      : `${totalVisible} corridas carregadas`);

  return (
    <div className="sticky top-0 z-10 -mx-1 rounded-[1.5rem] border border-blue-500/20 bg-background/95 px-4 py-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-bold text-text-primary">
            {selectionCountLabel}
          </p>
          <p className="text-xs text-text-secondary">{visibilityLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-xl border border-border-subtle bg-secondary/10 px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary"
          >
            Cancelar
          </button>
          {!hideInlineActions ? (
            <>
              <button
                type="button"
                onClick={onToggleSelectAll}
                className="inline-flex items-center rounded-xl border border-border-subtle bg-secondary/10 px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:bg-secondary/15 hover:text-text-primary"
              >
                {selectAllLabel}
              </button>
              <button
                type="button"
                onClick={onDeleteSelected}
                disabled={selectedCount === 0 || isDeleting}
                className="inline-flex items-center rounded-xl border border-blue-500/15 bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
