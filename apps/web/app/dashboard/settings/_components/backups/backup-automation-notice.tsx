'use client';

import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BackupAutomationStatus } from '@/types/backups';

interface BackupAutomationNoticeProps {
  status: BackupAutomationStatus | null;
  isLoading: boolean;
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

export function BackupAutomationNotice({
  status,
  isLoading,
}: BackupAutomationNoticeProps) {
  const isHealthy = status?.automation.health === 'registered';

  const days = getDaysFromCron(status?.automation?.functionalCron);
  const frequencyText = days === 1 ? 'todos os dias' : `de ${days} em ${days} dias`;

  return (
    <div className="rounded-2xl border border-border-subtle bg-card/40 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">Configurações de Automação</h4>
            {isLoading && (
              <span className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Carregando...
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isHealthy
              ? `Fique tranquilo! Seus backups são gerados automaticamente de forma segura ${frequencyText}. Nós armazenamos os seus últimos ${status.retentionCount} backups.`
              : 'O agendamento automático não está disponível no momento. Recomendamos gerar backups manuais para sua segurança.'}
          </p>
        </div>
      </div>
    </div>
  );
}
