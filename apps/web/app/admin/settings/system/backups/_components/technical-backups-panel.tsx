'use client';

import { useState, useMemo } from 'react';
import {
  DatabaseBackup,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Info,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackupDownloadInlineStatus } from '@/components/backup-download-inline-status';
import { Button } from '@/components/ui/button';
import type { BackupDownloadState } from '@/hooks/use-backup-download';
import type { BackupJobSummary } from '@/types/backups';

interface TechnicalBackupsPanelProps {
  backups: BackupJobSummary[];
  isLoading: boolean;
  errorMessage: string | null;
  isCreating: boolean;
  downloadState: BackupDownloadState;
  isPreparingDownload: boolean;
  isDownloadActive: (backupId: string) => boolean;
  onCreate: () => void;
  onDownload: (backupId: string) => void;
}

export function TechnicalBackupsPanel({
  backups,
  isLoading,
  errorMessage,
  isCreating,
  downloadState,
  isPreparingDownload,
  isDownloadActive,
  onCreate,
  onDownload,
}: TechnicalBackupsPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'pending' | 'running'>('all');
  const [triggerFilter, setTriggerFilter] = useState<'all' | 'manual' | 'scheduled'>('all');
  
  const itemsPerPage = 10;

  // Filtragem
  const filteredBackups = useMemo(() => {
    return backups.filter(b => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchTrigger = triggerFilter === 'all' || b.trigger === triggerFilter;
      return matchStatus && matchTrigger;
    });
  }, [backups, statusFilter, triggerFilter]);

  // Paginacao
  const totalPages = Math.ceil(filteredBackups.length / itemsPerPage);
  const paginatedBackups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBackups.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBackups, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[2rem] border border-border-subtle bg-card/70 p-6 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-info mb-1">
            <ShieldCheck size={14} /> Admin Area
          </div>
          <h1 className="text-xl font-bold text-foreground">Dumps Puros (PostgreSQL)</h1>
          <p className="text-sm text-muted-foreground">Historico e execucao de dumps completos para disaster recovery extremo.</p>
        </div>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          disabled={isCreating}
          onClick={onCreate}
        >
          <DatabaseBackup className="mr-2 h-4 w-4" />
          {isCreating ? 'Enfileirando...' : 'Gerar Dump Agora'}
        </Button>
      </div>

      {/* FILTER BAR & LIST */}
      <div className="rounded-[2rem] border border-border-subtle bg-card/70 shadow-sm backdrop-blur-xl overflow-hidden">
        
        {/* Top Controls */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 bg-background/50">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-muted-foreground" />
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              className="bg-transparent text-sm font-medium text-foreground focus:outline-none"
            >
              <option value="all">Satus: Todos</option>
              <option value="success">Status: Sucesso</option>
              <option value="failed">Status: Falha</option>
              <option value="pending">Status: Pendente</option>
              <option value="running">Status: Em Progresso</option>
            </select>
            <span className="text-border-subtle">|</span>
            <select 
              value={triggerFilter} 
              onChange={(e) => { setTriggerFilter(e.target.value as any); setCurrentPage(1); }}
              className="bg-transparent text-sm font-medium text-foreground focus:outline-none"
            >
              <option value="all">Trigger: Todos</option>
              <option value="manual">Trigger: Manual</option>
              <option value="scheduled">Trigger: Auto</option>
            </select>
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {filteredBackups.length} registos
          </div>
        </div>
        {/* Content */}
        <div className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center animate-pulse text-sm text-muted-foreground">
              Carregando historico tecnico...
            </div>
          ) : errorMessage ? (
            <div className="m-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : filteredBackups.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Nenhum dump compativel com o filtro.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {/* Fake Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-background/30 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-3">Data</div>
                <div className="col-span-2">Trigger</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Tamanho</div>
                <div className="col-span-2 text-right">Acoes</div>
              </div>

              {/* Rows */}
              {paginatedBackups.map((backup) => (
                <BackupRow 
                  key={backup.id} 
                  backup={backup} 
                  downloadState={downloadState}
                  isPreparingDownload={isPreparingDownload}
                  isDownloadActive={isDownloadActive}
                  onDownload={onDownload} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4 bg-background/50">
            <span className="text-sm text-muted-foreground">
              Pagina <strong className="text-foreground">{currentPage}</strong> de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border-subtle hover:bg-hover-accent"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border-subtle hover:bg-hover-accent"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Proxima
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- Row Component c/ Accordion ---

function BackupRow({
  backup,
  downloadState,
  isPreparingDownload,
  isDownloadActive,
  onDownload,
}: {
  backup: BackupJobSummary;
  downloadState: BackupDownloadState;
  isPreparingDownload: boolean;
  isDownloadActive: (backupId: string) => boolean;
  onDownload: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/20 label-success' },
    failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20 label-destructive' },
    running: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10 border-warning/20 label-warning animate-pulse' },
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-background/80 border-border-subtle' },
  };

  const currentStatus = statusConfig[backup.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;
  const hasActiveDownload = isDownloadActive(backup.id);
  const downloadPhase = hasActiveDownload ? downloadState.phase : 'idle';
  const isDownloadFeedbackVisible =
    downloadState.backupId === backup.id && downloadState.phase !== 'idle';
  const isDownloadDisabled =
    backup.status !== 'success' ||
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
      layout
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`transition-colors hover:bg-hover-accent ${isExpanded ? 'bg-hover-accent/50' : ''} ${rowToneClassName}`}
    >
      {/* Row Header (Clickable anywhere except buttons) */}
      <div 
        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="col-span-12 md:col-span-3 flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          <div className="text-sm font-semibold text-foreground">
            {new Date(backup.createdAt).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>

        <div className="col-span-6 md:col-span-2 text-sm text-muted-foreground">
          {backup.trigger === 'scheduled' ? 'Automacao' : 'Manual'}
        </div>

        <div className="col-span-6 md:col-span-3 flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide capitalize ${currentStatus.color} ${currentStatus.bg}`}>
            <StatusIcon size={12} />
            {backup.status}
          </div>
        </div>

        <div className="col-span-6 md:col-span-2 text-left md:text-right text-sm font-medium text-foreground">
          {backup.sizeBytes ? `${(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB` : '-'}
        </div>

        <div className="col-span-6 md:col-span-2 text-right">
          <Button
            size="sm"
            variant="outline"
            className="border-border-subtle bg-background/50 hover:bg-background h-8"
            disabled={isDownloadDisabled}
            onClick={(e) => {
              e.stopPropagation();
              onDownload(backup.id);
            }}
          >
            {downloadPhase === 'requesting' ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : downloadPhase === 'started' ? (
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-success" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5" />
            )}
            {downloadPhase === 'requesting'
              ? 'Preparando...'
              : downloadPhase === 'started'
                ? 'Iniciado'
                : 'Baixar'}
          </Button>
        </div>
      </div>

      <BackupDownloadInlineStatus
        state={downloadState}
        isVisible={isDownloadFeedbackVisible}
        className="px-6 pb-4"
      />

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-1 md:pl-[3.25rem]">
              <div className="rounded-xl border border-border-subtle bg-background/40 p-4 space-y-3 relative">
                <div className="absolute right-4 top-4 text-muted-foreground/30">
                  <DatabaseBackup size={48} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 justify-start uppercase tracking-wider">
                      <Info size={12} /> External Job ID
                    </span>
                    <p className="text-sm text-foreground font-mono break-all">{backup.id}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timing</span>
                    <p className="text-sm text-foreground">
                      Started: {backup.startedAt ? new Date(backup.startedAt).toLocaleTimeString() : '-'}<br/>
                      Finished: {backup.finishedAt ? new Date(backup.finishedAt).toLocaleTimeString() : '-'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Integrity</span>
                    <p className="text-sm text-foreground font-mono truncate" title={backup.checksum || ''}>
                      {backup.checksum ? backup.checksum.substring(0, 16) + '...' : 'Missing Checksum'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Manifest V{backup.manifestVersion}</p>
                  </div>
                </div>

                {backup.errorMessage && (
                  <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive relative z-10">
                    <strong className="block mb-1">Fatal Error:</strong>
                    {backup.errorMessage}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
