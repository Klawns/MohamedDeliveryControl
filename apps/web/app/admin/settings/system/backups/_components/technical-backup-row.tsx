'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  DatabaseBackup,
  Info,
} from 'lucide-react';
import { BackupDownloadInlineStatus } from '@/components/backup-download-inline-status';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { BackupDownloadState } from '@/hooks/use-backup-download';
import { cn } from '@/lib/utils';
import type { BackupJobSummary } from '@/types/backups';
import { getTechnicalBackupRowPresentation } from '../_mappers/technical-backup.presenter';

interface TechnicalBackupRowProps {
  backup: BackupJobSummary;
  downloadState: BackupDownloadState;
  isPreparingDownload: boolean;
  isDownloadActive: (backupId: string) => boolean;
  onDownload: (backupId: string) => void;
}

export function TechnicalBackupRow({
  backup,
  downloadState,
  isPreparingDownload,
  isDownloadActive,
  onDownload,
}: TechnicalBackupRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const presentation = getTechnicalBackupRowPresentation(backup, {
    downloadState,
    isPreparingDownload,
    isDownloadActive,
  });
  const StatusIcon = presentation.status.icon;
  const DownloadIcon = presentation.download.icon;

  return (
    <motion.div
      layout
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'transition-colors hover:bg-hover-accent',
        isExpanded && 'bg-hover-accent/50',
        presentation.download.rowToneClassName,
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-12 md:items-center">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="col-span-1 grid grid-cols-1 gap-4 text-left md:col-span-10 md:grid-cols-10"
              aria-label={
                isExpanded
                  ? 'Ocultar detalhes do backup tecnico'
                  : 'Exibir detalhes do backup tecnico'
              }
            >
              <div className="md:col-span-3 flex items-start gap-3">
                <span className="text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
                <div className="space-y-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {presentation.createdAtLabel}
                  </span>
                  {presentation.details.displayName ? (
                    <span className="block text-xs font-medium text-muted-foreground">
                      {presentation.details.displayName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-2 text-sm text-muted-foreground">
                {presentation.triggerLabel}
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide',
                    presentation.status.className,
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {presentation.status.label}
                </span>
                {presentation.details.warningMessage ? (
                  <span className="inline-flex items-center rounded-full border border-warning/20 bg-warning/10 px-2.5 py-0.5 text-xs font-bold tracking-wide text-warning">
                    Fallback R2
                  </span>
                ) : null}
              </div>

              <div className="md:col-span-2 text-left text-sm font-medium text-foreground md:text-right">
                {presentation.sizeLabel}
              </div>
            </button>
          </CollapsibleTrigger>

          <div className="col-span-1 flex justify-start md:col-span-2 md:justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border-subtle bg-background/50 hover:bg-background"
              disabled={presentation.download.isDisabled}
              onClick={() => onDownload(backup.id)}
            >
              <DownloadIcon
                className={cn(
                  'mr-2 h-3.5 w-3.5',
                  presentation.download.iconClassName,
                )}
              />
              {presentation.download.label}
            </Button>
          </div>
        </div>

        <BackupDownloadInlineStatus
          state={downloadState}
          isVisible={presentation.download.isFeedbackVisible}
          className="px-6 pb-4"
        />

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="px-6 pb-5 pt-1 md:pl-[3.25rem]">
            <div className="relative space-y-3 rounded-xl border border-border-subtle bg-background/40 p-4">
              <div className="absolute right-4 top-4 text-muted-foreground/30">
                <DatabaseBackup size={48} />
              </div>

              <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Info className="h-3 w-3" /> External Job ID
                  </span>
                  <p className="break-all font-mono text-sm text-foreground">
                    {presentation.details.externalJobId}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Arquivo
                  </span>
                  <p className="break-all font-mono text-sm text-foreground">
                    {presentation.details.displayName ?? 'Nome padrao'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Timing
                  </span>
                  <p className="text-sm text-foreground">
                    Started: {presentation.details.startedAtLabel}
                    <br />
                    Finished: {presentation.details.finishedAtLabel}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Integrity
                  </span>
                  <p
                    className="truncate font-mono text-sm text-foreground"
                    title={presentation.details.checksumTitle ?? undefined}
                  >
                    {presentation.details.checksumLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {presentation.details.manifestLabel}
                  </p>
                </div>
              </div>

              {presentation.details.warningMessage ? (
                <div className="relative z-10 mt-4 rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
                  <strong className="mb-1 block">Warning:</strong>
                  {presentation.details.warningMessage}
                </div>
              ) : null}

              {presentation.details.errorMessage ? (
                <div className="relative z-10 mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <strong className="mb-1 block">Fatal Error:</strong>
                  {presentation.details.errorMessage}
                </div>
              ) : null}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
