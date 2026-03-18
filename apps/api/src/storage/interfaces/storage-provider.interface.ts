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

  delete(key: string): Promise<void>;

  getSignedUrl?(key: string): Promise<string>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
