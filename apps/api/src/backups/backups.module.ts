import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { BACKUPS_QUEUE } from './backups.constants';
import { AdminBackupsController } from './admin-backups.controller';
import { BackupsAutomationService } from './backups-automation.service';
import { BackupsController } from './backups.controller';
import { BackupsRepository } from './backups.repository';
import { BackupsService } from './backups.service';
import {
  BACKUP_STORAGE_PROVIDERS,
  type BackupStorageProvider,
} from './interfaces/backup-storage-provider.interface';
import { R2BackupStorageProvider } from './providers/r2-backup-storage.provider';
import { RcloneDriveBackupStorageProvider } from './providers/rclone-drive-backup-storage.provider';
import { BackupJobsWorker } from './queue/backup-jobs.worker';
import { BackupJobOrchestratorService } from './services/backup-job-orchestrator.service';
import { BackupRetentionService } from './services/backup-retention.service';
import { BackupStorageRegistryService } from './services/backup-storage-registry.service';
import { FunctionalBackupArchiveService } from './services/functional-backup-archive.service';
import { FunctionalBackupImportArchiveParserService } from './services/functional-backup-import-archive-parser.service';
import { FunctionalBackupImportDatasetValidatorService } from './services/functional-backup-import-dataset-validator.service';
import { FunctionalBackupImportExecutorService } from './services/functional-backup-import-executor.service';
import { FunctionalBackupImportPreviewUploadCoordinatorService } from './services/functional-backup-import-preview-upload-coordinator.service';
import { FunctionalBackupImportService } from './services/functional-backup-import.service';
import { FunctionalBackupsService } from './services/functional-backups.service';
import { RcloneProcessService } from './services/rclone-process.service';
import { SystemBackupAdminService } from './services/system-backup-admin.service';
import { SystemBackupRetentionService } from './services/system-backup-retention.service';
import { SystemBackupSchedulerService } from './services/system-backup-scheduler.service';
import { SystemBackupSettingsService } from './services/system-backup-settings.service';
import { TechnicalBackupRunnerService } from './services/technical-backup-runner.service';
import { TechnicalBackupsService } from './services/technical-backups.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BACKUPS_QUEUE,
    }),
    StorageModule.register(),
    UsersModule,
  ],
  controllers: [BackupsController, AdminBackupsController],
  providers: [
    BackupsRepository,
    BackupsService,
    BackupsAutomationService,
    RcloneProcessService,
    R2BackupStorageProvider,
    RcloneDriveBackupStorageProvider,
    {
      provide: BACKUP_STORAGE_PROVIDERS,
      useFactory: (
        configService: ConfigService,
        r2Provider: R2BackupStorageProvider,
        rcloneDriveProvider: RcloneDriveBackupStorageProvider,
      ) => {
        const providers: BackupStorageProvider[] = [r2Provider];
        const rcloneRemote = configService.get<string>('RCLONE_REMOTE');

        if (typeof rcloneRemote === 'string' && rcloneRemote.trim().length > 0) {
          providers.push(rcloneDriveProvider);
        }

        return providers;
      },
      inject: [
        ConfigService,
        R2BackupStorageProvider,
        RcloneDriveBackupStorageProvider,
      ],
    },
    BackupStorageRegistryService,
    BackupJobsWorker,
    BackupJobOrchestratorService,
    BackupRetentionService,
    SystemBackupSettingsService,
    SystemBackupSchedulerService,
    SystemBackupAdminService,
    SystemBackupRetentionService,
    FunctionalBackupArchiveService,
    FunctionalBackupsService,
    FunctionalBackupImportArchiveParserService,
    FunctionalBackupImportDatasetValidatorService,
    FunctionalBackupImportExecutorService,
    FunctionalBackupImportPreviewUploadCoordinatorService,
    FunctionalBackupImportService,
    TechnicalBackupsService,
    TechnicalBackupRunnerService,
  ],
  exports: [BackupsService],
})
export class BackupsModule {}
