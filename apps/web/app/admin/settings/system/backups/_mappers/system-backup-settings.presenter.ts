import { formatDisplayDateValue } from '@/lib/date-utils';
import type { SystemBackupSettingsResponse } from '@/types/backups';

export function getSystemBackupScheduleSummary(
  settings: Pick<SystemBackupSettingsResponse, 'enabled' | 'schedule'>,
) {
  if (!settings.enabled) {
    return {
      summary: 'Backup sistêmico bloqueado por ambiente',
    };
  }

  switch (settings.schedule.mode) {
    case 'disabled':
      return {
        summary: 'Agendamento desativado',
      };
    case 'interval':
      return {
        summary: `A cada ${settings.schedule.intervalMinutes ?? 0} minutos`,
      };
    case 'fixed_time':
    default:
      return {
        summary: `Todos os dias as ${settings.schedule.fixedTime ?? '04:00'}`,
      };
  }
}

export function getSystemBackupRetentionSummary(
  settings: Pick<SystemBackupSettingsResponse, 'retention'>,
) {
  if (settings.retention.mode === 'max_age') {
    return `Arquivos com no maximo ${settings.retention.maxAgeDays ?? 0} dias`;
  }

  return `Manter os ultimos ${settings.retention.maxCount ?? 0} arquivos`;
}

export function getSystemBackupHealthLabel(
  settings: Pick<SystemBackupSettingsResponse, 'enabled' | 'scheduler'>,
) {
  if (!settings.enabled) {
    return 'Desativado por ambiente';
  }

  switch (settings.scheduler.health) {
    case 'registered':
      return 'Scheduler ativo';
    case 'failed':
      return 'Falha ao registrar scheduler';
    case 'disabled':
    default:
      return 'Agendamento desativado';
  }
}

export function getSystemBackupFailoverSummary(
  settings: Pick<SystemBackupSettingsResponse, 'failover'>,
) {
  if (!settings.failover?.enabled || !settings.failover.fallbackProviderId) {
    return 'Failover desativado';
  }

  const summary = `Failover ativo: ${settings.failover.primaryProviderId} -> ${settings.failover.fallbackProviderId}.`;

  if (
    !settings.failover.lastFallbackAt ||
    !settings.failover.lastFallbackReason
  ) {
    return summary;
  }

  return `${summary} Ultimo fallback em ${formatDisplayDateValue(settings.failover.lastFallbackAt)}: ${settings.failover.lastFallbackReason}`;
}
