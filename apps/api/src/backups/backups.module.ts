import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { BACKUPS_QUEUE } from './backups.constants';
import { AdminBackupsController } from './admin-backups.controller';
import { BackupsAutomationService } from './backups-automation.service';
import { BackupsController } from './backups.controller';
import { BackupsRepository } from './backups.repository';
import { BackupsService } from './backups.service';
import { BackupJobsWorker } from './queue/backup-jobs.worker';
import { FunctionalBackupArchiveService } from './services/functional-backup-archive.service';
import { FunctionalBackupImportService } from './services/functional-backup-import.service';
import { TechnicalBackupRunnerService } from './services/technical-backup-runner.service';

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
    BackupJobsWorker,
    FunctionalBackupArchiveService,
    FunctionalBackupImportService,
    TechnicalBackupRunnerService,
  ],
  exports: [BackupsService],
})
export class BackupsModule {}
