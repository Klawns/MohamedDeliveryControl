import type { Readable } from 'node:stream';

export type StorageVisibility = 'public' | 'private';

export interface StorageBufferUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export interface StorageStreamUploadFile {
  stream: Readable;
  mimetype: string;
  originalname: string;
}

export interface IStorageProvider {
  upload(
    file: StorageBufferUploadFile,
    path: string,
    options?: { cacheControl?: string },
  ): Promise<{ url: string; key: string }>;

  uploadPrivate(
    file: StorageBufferUploadFile,
    path: string,
    options?: { cacheControl?: string; contentDisposition?: string },
  ): Promise<{ key: string }>;

  uploadPrivateStream(
    file: StorageStreamUploadFile,
    path: string,
    options?: { cacheControl?: string; contentDisposition?: string },
  ): Promise<{ key: string }>;

  delete(
    key: string,
    options?: { visibility?: StorageVisibility },
  ): Promise<void>;

  getSignedUrl(
    key: string,
    options?: {
      expiresInSeconds?: number;
      downloadName?: string;
      visibility?: StorageVisibility;
    },
  ): Promise<string>;

  download(
    key: string,
    options?: { visibility?: StorageVisibility },
  ): Promise<Buffer>;

  downloadStream(
    key: string,
    options?: { visibility?: StorageVisibility },
  ): Promise<Readable>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
