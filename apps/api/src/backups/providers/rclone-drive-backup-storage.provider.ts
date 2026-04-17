import { Injectable } from '@nestjs/common';
import type {
  BackupStorageProvider,
  BackupStorageReference,
  BackupStorageUploadFile,
} from '../interfaces/backup-storage-provider.interface';
import { RcloneProcessService } from '../services/rclone-process.service';

@Injectable()
export class RcloneDriveBackupStorageProvider implements BackupStorageProvider {
  readonly id = 'rclone_drive';

  constructor(private readonly rcloneProcessService: RcloneProcessService) {}

  async upload(
    file: BackupStorageUploadFile,
    path: string,
  ): Promise<BackupStorageReference> {
    await this.rcloneProcessService.uploadBuffer(file.buffer, path);

    return {
      providerId: this.id,
      key: path,
      fileName: file.fileName,
      contentType: file.contentType,
    };
  }

  download(reference: BackupStorageReference) {
    return this.rcloneProcessService.download(reference.key);
  }

  async delete(reference: BackupStorageReference) {
    await this.rcloneProcessService.deleteFile(reference.key);
  }
}
