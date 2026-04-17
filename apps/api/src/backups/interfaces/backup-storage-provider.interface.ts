import type { Readable } from 'node:stream';

export interface BackupStorageUploadFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}

export interface BackupStorageReference {
  providerId: string;
  key: string;
  fileName: string;
  contentType: string;
}

export interface BackupStorageProvider {
  id: string;
  upload(
    file: BackupStorageUploadFile,
    path: string,
  ): Promise<BackupStorageReference>;
  download(reference: BackupStorageReference): Promise<Readable>;
  delete(reference: BackupStorageReference): Promise<void>;
}

export const BACKUP_STORAGE_PROVIDERS = 'BACKUP_STORAGE_PROVIDERS';
