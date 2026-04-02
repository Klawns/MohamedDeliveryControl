'use client';

import { TechnicalBackupsPanel } from './_components/technical-backups-panel';
import { useAdminBackups } from './_hooks/use-admin-backups';

export default function AdminBackupsPage() {
  const {
    backups,
    isLoading,
    errorMessage,
    isCreating,
    backupDownloadState,
    isPreparingDownload,
    isDownloadActive,
    createTechnicalBackup,
    openDownloadUrl,
  } = useAdminBackups();

  return (
    <TechnicalBackupsPanel
      backups={backups}
      isLoading={isLoading}
      errorMessage={errorMessage}
      isCreating={isCreating}
      downloadState={backupDownloadState}
      isPreparingDownload={isPreparingDownload}
      isDownloadActive={isDownloadActive}
      onCreate={() => void createTechnicalBackup()}
      onDownload={openDownloadUrl}
    />
  );
}
