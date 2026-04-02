export interface BackupJobSummary {
  id: string;
  kind: 'functional_user' | 'technical_full' | 'pre_import';
  trigger: 'manual' | 'scheduled' | 'pre_import';
  status: 'pending' | 'running' | 'success' | 'failed';
  checksum: string | null;
  sizeBytes: number | null;
  manifestVersion: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface BackupAutomationStatus {
  automation: {
    health: 'disabled' | 'registered' | 'failed';
    automationEnabled: boolean;
    functionalCron: string;
    technicalCron: string;
    functionalRegistered: boolean;
    technicalRegistered: boolean;
    lastCheckedAt: string | null;
  };
  historyLimit: number;
  retentionCount: number;
}

export interface BackupDownloadResponse {
  id: string;
  url: string;
  expiresInSeconds: number;
}

export interface BackupImportPreview {
  manifestVersion: number;
  ownerUserId: string;
  ownerName: string | null;
  createdAt: string;
  archiveChecksum: string;
  sizeBytes: number;
  modules: Array<
    'clients' | 'rides' | 'client_payments' | 'balance_transactions' | 'ride_presets'
  >;
  counts: {
    clients: number;
    rides: number;
    client_payments: number;
    balance_transactions: number;
    ride_presets: number;
  };
  warnings: string[];
}

export type BackupImportJobStatus =
  | 'validated'
  | 'running'
  | 'success'
  | 'failed';

export type BackupImportJobPhase =
  | 'validated'
  | 'backing_up'
  | 'importing'
  | 'completed'
  | 'failed';

export interface BackupImportJobResponse {
  id: string;
  status: BackupImportJobStatus;
  phase: BackupImportJobPhase;
  errorMessage: string | null;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  preview: BackupImportPreview;
}

export type BackupImportPreviewResponse = BackupImportJobResponse;
export type BackupImportExecutionResponse = BackupImportJobResponse;
