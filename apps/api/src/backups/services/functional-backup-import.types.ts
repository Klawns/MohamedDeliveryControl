import type { FunctionalBackupManifest } from './functional-backup-archive.service';

export type ImportableBackupModuleName =
  | 'clients'
  | 'rides'
  | 'client_payments'
  | 'balance_transactions'
  | 'ride_presets';

export interface ImportedClientRecord {
  id: string;
  displayId?: number | null;
  userId?: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  balance?: number | string | null;
  isPinned?: boolean;
  createdAt?: string | Date | null;
}

export interface ImportedRideRecord {
  id: string;
  displayId?: number | null;
  clientId: string;
  userId?: string;
  value: number | string;
  location?: string | null;
  notes?: string | null;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID';
  paidWithBalance?: number | string | null;
  debtValue?: number | string | null;
  rideDate?: string | Date | null;
  photo?: string | null;
  createdAt?: string | Date | null;
}

export interface ImportedClientPaymentRecord {
  id: string;
  clientId: string;
  userId?: string;
  amount: number | string;
  paymentDate?: string | Date | null;
  status?: 'UNUSED' | 'USED';
  notes?: string | null;
  createdAt?: string | Date | null;
}

export interface ImportedBalanceTransactionRecord {
  id: string;
  clientId: string;
  userId?: string;
  amount: number | string;
  type: 'CREDIT' | 'DEBIT';
  origin: 'PAYMENT_OVERFLOW' | 'RIDE_USAGE' | 'MANUAL_ADJUSTMENT';
  description?: string | null;
  createdAt?: string | Date | null;
}

export interface ImportedRidePresetRecord {
  id: string;
  userId?: string;
  label: string;
  value: number | string;
  location: string;
  createdAt?: string | Date | null;
}

export interface FunctionalBackupImportDataset {
  manifest: FunctionalBackupManifest;
  clients: ImportedClientRecord[];
  rides: ImportedRideRecord[];
  clientPayments: ImportedClientPaymentRecord[];
  balanceTransactions: ImportedBalanceTransactionRecord[];
  ridePresets: ImportedRidePresetRecord[];
}

export interface ParsedFunctionalBackupArchive {
  archiveChecksum: string;
  dataset: FunctionalBackupImportDataset;
  sizeBytes: number;
}

export interface FunctionalBackupImportPreview {
  manifestVersion: number;
  ownerUserId: string;
  ownerName: string | null;
  createdAt: string;
  archiveChecksum: string;
  sizeBytes: number;
  modules: ImportableBackupModuleName[];
  counts: Record<ImportableBackupModuleName, number>;
  warnings: string[];
}

export type FunctionalBackupImportJobStatus =
  | 'validated'
  | 'running'
  | 'success'
  | 'failed';

export type FunctionalBackupImportJobPhase =
  | 'validated'
  | 'backing_up'
  | 'importing'
  | 'completed'
  | 'failed';

export interface FunctionalBackupImportJobResponse {
  id: string;
  status: FunctionalBackupImportJobStatus;
  phase: FunctionalBackupImportJobPhase;
  preview: FunctionalBackupImportPreview;
  errorMessage: string | null;
  createdAt: Date | string | null;
  startedAt: Date | string | null;
  finishedAt: Date | string | null;
}
