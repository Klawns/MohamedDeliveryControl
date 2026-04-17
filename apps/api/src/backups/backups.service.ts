import { Injectable } from '@nestjs/common';
import { FunctionalBackupImportService } from './services/functional-backup-import.service';
import type { FunctionalBackupImportArchiveSource } from './services/functional-backup-import.types';
import { FunctionalBackupsService } from './services/functional-backups.service';
import { TechnicalBackupsService } from './services/technical-backups.service';

@Injectable()
export class BackupsService {
  constructor(
    private readonly functionalBackupsService: FunctionalBackupsService,
    private readonly functionalBackupImportService: FunctionalBackupImportService,
    private readonly technicalBackupsService: TechnicalBackupsService,
  ) {}

  async createManualFunctionalBackup(userId: string) {
    return this.functionalBackupsService.createManualBackup(userId);
  }

  async createManualTechnicalBackup(actorUserId: string) {
    return this.technicalBackupsService.createManualBackup(actorUserId);
  }

  async listUserBackups(userId: string) {
    return this.functionalBackupsService.listBackups(userId);
  }

  async listTechnicalBackups() {
    return this.technicalBackupsService.listBackups();
  }

  getUserBackupStatus() {
    return this.functionalBackupsService.getStatus();
  }

  async getDownloadUrl(userId: string, id: string) {
    return this.functionalBackupsService.getDownloadUrl(userId, id);
  }

  async getTechnicalDownloadUrl(id: string) {
    return this.technicalBackupsService.getDownloadUrl(id);
  }

  async getTechnicalDownloadFile(id: string) {
    return this.technicalBackupsService.getDownloadFile(id);
  }

  previewFunctionalImport(
    userId: string,
    upload: FunctionalBackupImportArchiveSource,
  ) {
    return this.functionalBackupImportService.previewImport(userId, upload);
  }

  getFunctionalImportStatus(userId: string, importJobId: string) {
    return this.functionalBackupImportService.getImportStatus(
      userId,
      importJobId,
    );
  }

  executeFunctionalImport(userId: string, importJobId: string) {
    return this.functionalBackupImportService.executeImport(
      userId,
      importJobId,
    );
  }
}
