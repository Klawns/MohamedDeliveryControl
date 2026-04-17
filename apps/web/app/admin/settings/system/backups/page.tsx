'use client';

import { TechnicalBackupsPanel } from './_components/technical-backups-panel';
import { useAdminBackups } from './_hooks/use-admin-backups';

export default function AdminBackupsPage() {
  const {
    backups,
    systemSettings,
    isLoading,
    isSettingsLoading,
    errorMessage,
    settingsErrorMessage,
    isCreating,
    isSavingSettings,
    backupDownloadState,
    isPreparingDownload,
    isDownloadActive,
    createTechnicalBackup,
    saveSystemBackupSettings,
    openDownloadUrl,
  } = useAdminBackups();

  return (
    <TechnicalBackupsPanel
      backups={backups}
      systemSettings={systemSettings}
      isLoading={isLoading}
      isSettingsLoading={isSettingsLoading}
      errorMessage={errorMessage}
      settingsErrorMessage={settingsErrorMessage}
      isCreating={isCreating}
      isSavingSettings={isSavingSettings}
      downloadState={backupDownloadState}
      isPreparingDownload={isPreparingDownload}
      isDownloadActive={isDownloadActive}
      onCreate={() => void createTechnicalBackup()}
      onSaveSettings={(input) => void saveSystemBackupSettings(input)}
      onDownload={openDownloadUrl}
    />
  );
}
