export type StorageVisibility = 'public' | 'private';

export interface IStorageProvider {
  upload(
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    },
    path: string,
    options?: { cacheControl?: string },
  ): Promise<{ url: string; key: string }>;

  uploadPrivate(
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    },
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
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
