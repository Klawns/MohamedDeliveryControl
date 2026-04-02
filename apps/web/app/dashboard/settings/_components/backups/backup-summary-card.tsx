'use client';

import { CalendarDays, Clock3, DatabaseBackup, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackupSummaryCardProps {
  retentionCount: number;
  latestBackupAt?: string | null;
  isCreating: boolean;
  isAutomationActive: boolean;
  functionalCron?: string | null;
  onCreate: () => void;
}

function getDaysFromCron(cron: string | undefined | null): number {
  if (!cron) return 3;
  const parts = cron.split(' ');
  if (parts.length >= 5) {
    const dom = parts[2];
    if (dom.startsWith('*/')) {
      return parseInt(dom.replace('*/', ''), 10) || 3;
    }
    if (dom === '*') {
      return 1;
    }
  }
  return 3;
}

export function BackupSummaryCard({
  retentionCount,
  latestBackupAt,
  isCreating,
  isAutomationActive,
  functionalCron,
  onCreate,
}: BackupSummaryCardProps) {
  const days = getDaysFromCron(functionalCron);
  const frequencyLabel = days === 1 ? 'Diária' : `De ${days} em ${days} dias`;
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <DatabaseBackup size={24} className="text-primary" />
            Backups
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Mantenha seus dados seguros. Seus backups são gerados automaticamente,
            mas você pode criar cópias manuais a qualquer momento.
          </p>
        </div>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onCreate}
          disabled={isCreating}
        >
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? 'Enfileirando...' : 'Gerar backup agora'}
        </Button>
      </div>

      {/* Estado Atual (Cards horizontais simples) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-card/70 px-4 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Clock3 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Último Backup
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
              {latestBackupAt
                ? new Date(latestBackupAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                : 'Nenhum'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-card/70 px-4 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-info/20 bg-info/10 text-info">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Automação
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
              {isAutomationActive ? `Ativa (${frequencyLabel})` : 'Desativada'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-card/70 px-4 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Retenção
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground">
              {retentionCount} dias
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
