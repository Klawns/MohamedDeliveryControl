import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2StorageProvider } from '../../storage/providers/r2/r2-storage.provider';
import type {
  BackupStorageProvider,
  BackupStorageReference,
  BackupStorageUploadFile,
} from '../interfaces/backup-storage-provider.interface';

@Injectable()
export class R2BackupStorageProvider implements BackupStorageProvider {
  readonly id = 'r2';
  private readonly provider: R2StorageProvider;

  constructor(configService: ConfigService) {
    this.provider = new R2StorageProvider(configService);
  }

  async upload(
    file: BackupStorageUploadFile,
    path: string,
  ): Promise<BackupStorageReference> {
    await this.provider.uploadPrivate(
      {
        buffer: file.buffer,
        mimetype: file.contentType,
        originalname: file.fileName,
      },
      path,
    );

    return {
      providerId: this.id,
      key: path,
      fileName: file.fileName,
      contentType: file.contentType,
    };
  }

  download(reference: BackupStorageReference) {
    return this.provider.downloadStream(reference.key, {
      visibility: 'private',
    });
  }

  async delete(reference: BackupStorageReference) {
    await this.provider.delete(reference.key, {
      visibility: 'private',
    });
  }
}
