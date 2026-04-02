'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Info,
  Loader2,
} from 'lucide-react';
import { BackupDownloadInlineStatus } from '@/components/backup-download-inline-status';
import { Button } from '@/components/ui/button';
import { HybridInfiniteList } from '@/components/ui/hybrid-infinite-list';
import { InfiniteScrollContainer } from '@/components/ui/infinite-scroll-container';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { BackupDownloadState } from '@/hooks/use-backup-download';
import type { BackupJobSummary } from '@/types/backups';

interface BackupHistoryListProps {
  backups: BackupJobSummary[];
  historyLimit: number;
  retentionCount: number;
  onDownload: (backupId: string) => void;
  downloadState: BackupDownloadState;
  isPreparingDownload: boolean;
  isDownloadActive: (backupId: string) => boolean;
}

const BACKUPS_BATCH_SIZE = 10;

function getPublicErrorMessage(job: BackupJobSummary) {
  if (job.status !== 'failed') return null;

  return job.kind === 'technical_full'
    ? 'Falha ao processar o backup tecnico. Revise a configuracao.'
    : 'Falha ao processar o backup. Revise a configuracao.';
}

function renderStatus(job: BackupJobSummary) {
  switch (job.status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Concluido
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4" />
          Falhou
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning">
          <Clock3 className="h-4 w-4" />
          {job.status === 'running' ? 'Processando' : 'Na fila'}
        </span>
      );
  }
}

function formatRelativeDate(date: Date) {
  const agora = new Date();
  const diffHoras = Math.abs(agora.getTime() - date.getTime()) / 36e5;

  if (diffHoras < 24 && date.getDate() === agora.getDate()) {
    return (
      'Hoje, ' +
      date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);

  if (
    date.getDate() === ontem.getDate() &&
    date.getMonth() === ontem.getMonth()
  ) {
    return (
      'Ontem, ' +
      date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function BackupHistoryList({
  backups,
  downloadState,
  isPreparingDownload,
  isDownloadActive,
  onDownload,
}: BackupHistoryListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(BACKUPS_BATCH_SIZE);

  const visibleBackups = useMemo(
    () => backups.slice(0, visibleCount),
    [backups, visibleCount],
  );
  const hasMore = visibleCount < backups.length;

  const loadMore = () => {
    setVisibleCount((current) =>
      Math.min(current + BACKUPS_BATCH_SIZE, backups.length),
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Seus backups</h3>

      {backups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
          Voce ainda nao possui backups armazenados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-card/70 shadow-sm backdrop-blur-xl">
          <div className="hidden grid-cols-12 items-center border-b border-border-subtle bg-muted/20 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <div className="col-span-3">Data</div>
            <div className="col-span-3">Origem e Tamanho</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-3 text-right">Acao</div>
          </div>

          <InfiniteScrollContainer
            ref={scrollContainerRef}
            maxHeight="28rem"
            hideScrollbar={true}
            className="w-full"
            qaId="backups-list"
          >
            <HybridInfiniteList
              items={visibleBackups}
              containerRef={scrollContainerRef}
              estimateSize={112}
              hasMore={hasMore}
              onLoadMore={loadMore}
              listClassName="flex flex-col"
              className="w-full"
              renderItem={(backup, index) => {
                const isLastVisibleItem = index === visibleBackups.length - 1;
                const data = new Date(backup.createdAt);
                const isAuto = backup.trigger === 'scheduled';
                const size = backup.sizeBytes
                  ? `${(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                  : '--';
                const errorLabel = getPublicErrorMessage(backup);
                const hasActiveDownload = isDownloadActive(backup.id);
                const isDownloadAvailable = backup.status === 'success';
                const downloadPhase = hasActiveDownload
                  ? downloadState.phase
                  : 'idle';
                const isDownloadFeedbackVisible =
                  downloadState.backupId === backup.id &&
                  downloadState.phase !== 'idle';
                const isButtonDisabled =
                  !isDownloadAvailable ||
                  isPreparingDownload ||
                  downloadPhase === 'started';
                const rowToneClassName =
                  downloadPhase === 'requesting'
                    ? 'bg-info/5'
                    : downloadPhase === 'started'
                      ? 'bg-success/5'
                      : downloadPhase === 'failed'
                        ? 'bg-destructive/5'
                        : '';

                return (
                  <motion.div
                    key={backup.id}
                    layout
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`flex flex-col px-6 py-4 transition-colors duration-300 ${
                      !isLastVisibleItem || hasMore
                        ? 'border-b border-border-subtle'
                        : ''
                    } ${rowToneClassName}`}
                  >
                    <div className="grid gap-4 md:grid-cols-12 md:items-center md:gap-0">
                      <div className="col-span-3 flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {formatRelativeDate(data)}
                        </span>
                      </div>

                      <div className="col-span-3 flex flex-row items-center gap-3 md:flex-col md:items-start md:gap-1">
                        <span className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {isAuto ? 'Automatico' : 'Manual'}
                        </span>
                        <span className="text-sm text-muted-foreground">{size}</span>
                      </div>

                      <div className="col-span-3 flex flex-col items-start gap-1">
                        {renderStatus(backup)}
                        {errorLabel ? (
                          <span className="text-xs text-destructive">{errorLabel}</span>
                        ) : null}
                      </div>

                      <div className="col-span-3 flex items-center justify-start gap-2 md:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border-subtle bg-background/50 text-foreground hover:bg-hover-accent"
                          disabled={isButtonDisabled}
                          onClick={() => onDownload(backup.id)}
                        >
                          {downloadPhase === 'requesting' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : downloadPhase === 'started' ? (
                            <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {downloadPhase === 'requesting'
                            ? 'Preparando...'
                            : downloadPhase === 'started'
                              ? 'Iniciado'
                              : 'Baixar'}
                        </Button>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-64 space-y-2 p-4 text-sm"
                            align="end"
                          >
                            <div className="font-semibold">Detalhes Tecnicos</div>
                            <div className="grid grid-cols-2 gap-y-1 text-muted-foreground">
                              <span>ID do Job:</span>
                              <span
                                className="truncate font-mono"
                                title={backup.id}
                              >
                                {backup.id}
                              </span>
                              <span>Tipo:</span>
                              <span>{backup.kind}</span>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <BackupDownloadInlineStatus
                      state={downloadState}
                      isVisible={isDownloadFeedbackVisible}
                      className="mt-3"
                    />
                  </motion.div>
                );
              }}
            />
          </InfiniteScrollContainer>
        </div>
      )}
    </div>
  );
}
