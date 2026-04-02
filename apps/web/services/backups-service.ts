import { apiClient } from '@/services/api';
import type {
  BackupAutomationStatus,
  BackupDownloadResponse,
  BackupImportExecutionResponse,
  BackupImportJobResponse,
  BackupImportPreviewResponse,
  BackupJobSummary,
} from '@/types/backups';

export const backupsService = {
  async listUserBackups(signal?: AbortSignal): Promise<BackupJobSummary[]> {
    return apiClient.get<BackupJobSummary[]>('/backups', { signal });
  },

  async createManualBackup(): Promise<BackupJobSummary> {
    return apiClient.post<BackupJobSummary>('/backups/manual');
  },

  async getUserBackupStatus(
    signal?: AbortSignal,
  ): Promise<BackupAutomationStatus> {
    return apiClient.get<BackupAutomationStatus>('/backups/status', { signal });
  },

  async getDownloadUrl(backupId: string): Promise<BackupDownloadResponse> {
    return apiClient.get<BackupDownloadResponse>(`/backups/${backupId}/download`);
  },

  async previewImport(file: File): Promise<BackupImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<BackupImportPreviewResponse>(
      '/backups/import/preview',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  },

  async executeImport(
    importJobId: string,
  ): Promise<BackupImportExecutionResponse> {
    return apiClient.post<BackupImportExecutionResponse>('/backups/import/execute', {
      importJobId,
    });
  },

  async getImportStatus(
    importJobId: string,
    signal?: AbortSignal,
  ): Promise<BackupImportJobResponse> {
    return apiClient.get<BackupImportJobResponse>(
      `/backups/import/${importJobId}`,
      { signal },
    );
  },

  async listTechnicalBackups(signal?: AbortSignal): Promise<BackupJobSummary[]> {
    return apiClient.get<BackupJobSummary[]>('/admin/backups/technical', {
      signal,
    });
  },

  async createManualTechnicalBackup(): Promise<BackupJobSummary> {
    return apiClient.post<BackupJobSummary>('/admin/backups/technical/manual');
  },

  async getTechnicalDownloadUrl(
    backupId: string,
  ): Promise<BackupDownloadResponse> {
    return apiClient.get<BackupDownloadResponse>(
      `/admin/backups/technical/${backupId}/download`,
    );
  },
};

export default backupsService;
