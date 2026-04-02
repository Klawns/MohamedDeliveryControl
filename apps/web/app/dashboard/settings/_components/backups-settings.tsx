'use client';

import { BackupAutomationNotice } from './backups/backup-automation-notice';
import { BackupHistoryList } from './backups/backup-history-list';
import { BackupImportCard } from './backups/backup-import-card';
import { BackupSummaryCard } from './backups/backup-summary-card';
import { useBackups } from '../_hooks/use-backups';

export function BackupsSettings() {
  const {
    backups,
    backupStatus,
    isLoading,
    isStatusLoading,
    isCreatingBackup,
    backupDownloadState,
    isPreparingDownload,
    isDownloadActive,
    isPreviewingImport,
    isExecutingImport,
    previewResult,
    createManualBackup,
    openDownloadUrl,
    previewImport,
    executeImport,
    refreshBackups,
  } = useBackups();

  const latestSuccessfulBackup = backups.find(
    (backup) => backup.status === 'success',
  );

  return (
    <div className="space-y-8">
      {/* 1. Header e Metricas Atuais */}
      <BackupSummaryCard
        retentionCount={backupStatus?.retentionCount ?? 7}
        latestBackupAt={latestSuccessfulBackup?.createdAt ?? null}
        isCreating={isCreatingBackup}
        isAutomationActive={backupStatus?.automation?.automationEnabled ?? false}
        functionalCron={backupStatus?.automation?.functionalCron}
        onCreate={() => void createManualBackup()}
      />

      {/* 2. Historico Central */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-[2rem] border border-border-subtle bg-card/70 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-xl animate-pulse">
          Carregando historico...
        </div>
      ) : (
        <BackupHistoryList
          backups={backups}
          historyLimit={backupStatus?.historyLimit ?? 7}
          retentionCount={backupStatus?.retentionCount ?? 7}
          downloadState={backupDownloadState}
          isPreparingDownload={isPreparingDownload}
          isDownloadActive={isDownloadActive}
          onDownload={openDownloadUrl}
        />
      )}

      {/* 3. Configuracoes e Avisos Secundarios */}
      <BackupAutomationNotice status={backupStatus} isLoading={isStatusLoading} />

      {/* 4. Zona de Risco */}
      <BackupImportCard
        preview={previewResult}
        isPreviewing={isPreviewingImport}
        isExecuting={isExecutingImport}
        onPreview={previewImport}
        onExecute={executeImport}
      />
    </div>
  );
}
