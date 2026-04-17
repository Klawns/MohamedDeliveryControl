import {
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { formatDisplayDateValue, normalizeDateValue } from '@/lib/date-utils';
import type {
  BackupDownloadPhase,
  BackupDownloadState,
} from '@/hooks/use-backup-download';
import type { BackupJobSummary } from '@/types/backups';

interface TechnicalBackupStatusPresentation {
  label: string;
  icon: LucideIcon;
  className: string;
}

interface TechnicalBackupDownloadPresentation {
  phase: BackupDownloadPhase;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  rowToneClassName: string;
  isDisabled: boolean;
  isFeedbackVisible: boolean;
}

interface TechnicalBackupDetailsPresentation {
  externalJobId: string;
  displayName: string | null;
  warningMessage: string | null;
  startedAtLabel: string;
  finishedAtLabel: string;
  checksumLabel: string;
  checksumTitle: string | null;
  manifestLabel: string;
  errorMessage: string | null;
}

export interface TechnicalBackupRowPresentation {
  createdAtLabel: string;
  triggerLabel: string;
  status: TechnicalBackupStatusPresentation;
  sizeLabel: string;
  download: TechnicalBackupDownloadPresentation;
  details: TechnicalBackupDetailsPresentation;
}

interface TechnicalBackupRowPresentationOptions {
  downloadState: BackupDownloadState;
  isPreparingDownload: boolean;
  isDownloadActive: (backupId: string) => boolean;
}

const TECHNICAL_BACKUP_STATUS_MAP: Record<
  BackupJobSummary['status'],
  TechnicalBackupStatusPresentation
> = {
  success: {
    label: 'Concluido',
    icon: CheckCircle2,
    className:
      'text-success bg-success/10 border-success/20 label-success',
  },
  failed: {
    label: 'Falhou',
    icon: XCircle,
    className:
      'text-destructive bg-destructive/10 border-destructive/20 label-destructive',
  },
  running: {
    label: 'Em progresso',
    icon: Clock,
    className:
      'text-warning bg-warning/10 border-warning/20 label-warning animate-pulse',
  },
  pending: {
    label: 'Na fila',
    icon: Clock,
    className: 'text-muted-foreground bg-background/80 border-border-subtle',
  },
};

function getTriggerLabel(trigger: BackupJobSummary['trigger']) {
  switch (trigger) {
    case 'scheduled':
      return 'Agendada';
    case 'manual':
      return 'Manual';
    case 'pre_import':
      return 'Pre-importacao';
    default:
      return 'Desconhecida';
  }
}

function formatBackupSize(sizeBytes: number | null) {
  if (sizeBytes === null) {
    return '-';
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatBackupTime(value: string | null) {
  const date = normalizeDateValue(value);
  if (!date) {
    return '-';
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatChecksum(checksum: string | null) {
  if (!checksum) {
    return {
      label: 'Checksum indisponivel',
      title: null,
    };
  }

  return {
    label: checksum.length > 16 ? `${checksum.slice(0, 16)}...` : checksum,
    title: checksum,
  };
}

function getDownloadPresentation(
  backup: BackupJobSummary,
  options: TechnicalBackupRowPresentationOptions,
): TechnicalBackupDownloadPresentation {
  const isCurrentDownload =
    options.downloadState.backupId === backup.id &&
    (options.isDownloadActive(backup.id) ||
      options.downloadState.phase === 'failed');
  const phase = isCurrentDownload ? options.downloadState.phase : 'idle';

  const rowToneClassName =
    phase === 'requesting'
      ? 'bg-info/5'
      : phase === 'started'
        ? 'bg-success/5'
        : phase === 'failed'
          ? 'bg-destructive/5'
          : '';

  return {
    phase,
    label:
      phase === 'requesting'
        ? 'Preparando...'
        : phase === 'started'
          ? 'Iniciado'
          : phase === 'failed'
            ? 'Tentar novamente'
            : 'Baixar',
    icon:
      phase === 'requesting'
        ? Loader2
        : phase === 'started'
          ? CheckCircle2
          : Download,
    iconClassName:
      phase === 'requesting'
        ? 'animate-spin'
        : phase === 'started'
          ? 'text-success'
          : undefined,
    rowToneClassName,
    isDisabled:
      backup.status !== 'success' ||
      options.isPreparingDownload ||
      phase === 'started',
    isFeedbackVisible: isCurrentDownload && phase !== 'idle',
  };
}

export function getTechnicalBackupRowPresentation(
  backup: BackupJobSummary,
  options: TechnicalBackupRowPresentationOptions,
): TechnicalBackupRowPresentation {
  const checksum = formatChecksum(backup.checksum);

  return {
    createdAtLabel: formatDisplayDateValue(backup.createdAt),
    triggerLabel: getTriggerLabel(backup.trigger),
    status: TECHNICAL_BACKUP_STATUS_MAP[backup.status],
    sizeLabel: formatBackupSize(backup.sizeBytes),
    download: getDownloadPresentation(backup, options),
    details: {
      externalJobId: backup.id,
      displayName: backup.displayName ?? null,
      warningMessage: backup.warnings?.[0] ?? null,
      startedAtLabel: formatBackupTime(backup.startedAt),
      finishedAtLabel: formatBackupTime(backup.finishedAt),
      checksumLabel: checksum.label,
      checksumTitle: checksum.title,
      manifestLabel: `Manifest v${backup.manifestVersion}`,
      errorMessage: backup.errorMessage,
    },
  };
}
