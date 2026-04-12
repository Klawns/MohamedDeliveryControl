import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FinanceFilterChip } from '../_lib/finance-filter-chips';
import { getPeriodAccent } from '../_lib/finance-theme';
import type { Period } from '../_types';

interface FinanceActionBarProps {
  currentPeriod: Period;
  activeFilterChips: FinanceFilterChip[];
  isLoading: boolean;
  isFetching: boolean;
  isExportingPdf: boolean;
  hasData: boolean;
  onExport: () => void;
  onExportCSV: () => void;
}

export function FinanceActionBar({
  currentPeriod,
  activeFilterChips,
  isLoading,
  isFetching,
  isExportingPdf,
  hasData,
  onExport,
  onExportCSV,
}: FinanceActionBarProps) {
  const accent = getPeriodAccent(currentPeriod.id);
  const isPdfDisabled = isLoading || isFetching || isExportingPdf;
  const isSpreadsheetDisabled =
    isLoading || isFetching || !hasData || isExportingPdf;

  return (
    <section className="rounded-[1.75rem] border border-border-subtle bg-card-background p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
            Exportar
          </p>
          <span className="text-xs font-medium text-text-muted">
            PDF ou planilha
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeFilterChips.map((chip, index) => (
            <span
              key={chip.id}
              className={cn(
                'inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-xs font-semibold',
                index === 0
                  ? cn(accent.badge, 'shadow-none')
                  : 'border border-border-subtle bg-background text-text-secondary',
              )}
            >
              <span className="truncate">{chip.label}</span>
            </span>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={onExport}
            disabled={isPdfDisabled}
            className={cn(
              'h-12 w-full rounded-2xl px-5 font-bold',
              accent.badge,
              isPdfDisabled && 'opacity-50',
            )}
          >
            {isExportingPdf ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            {isExportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>

          <Button
            onClick={onExportCSV}
            disabled={isSpreadsheetDisabled}
            variant="outline"
            className="h-12 w-full rounded-2xl border-border-subtle bg-background px-5 font-bold text-text-primary"
          >
            <FileSpreadsheet className="mr-2 size-4 text-primary" />
            Exportar planilha
          </Button>
        </div>
      </div>
    </section>
  );
}
