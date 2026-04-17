import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupsRepository } from '../backups.repository';
import { BackupStorageRegistryService } from './backup-storage-registry.service';
import { SystemBackupRetentionService } from './system-backup-retention.service';
import { SystemBackupSchedulerService } from './system-backup-scheduler.service';
import type { SystemBackupSettings } from './system-backup-settings.service';
import { SystemBackupSettingsService } from './system-backup-settings.service';

@Injectable()
export class SystemBackupAdminService {
  private readonly logger = new Logger(SystemBackupAdminService.name);

  constructor(
    private readonly settingsService: SystemBackupSettingsService,
    private readonly schedulerService: SystemBackupSchedulerService,
    private readonly retentionService: SystemBackupRetentionService,
    private readonly backupsRepository: BackupsRepository,
    private readonly backupStorageRegistry: BackupStorageRegistryService,
    private readonly configService: ConfigService,
  ) {}

  async getSettings() {
    this.logger.log({
      context: 'systemBackupAdmin.getSettings:start',
    });

    const settings = await this.settingsService.getSettings();
    const enabled =
      this.configService.get<string>('PG_DUMP_BACKUP_ENABLED') !== 'false';
    const providerId = this.backupStorageRegistry.getActiveProvider().id;
    const failover = await this.getFailoverStatus(providerId);
    const response = {
      enabled,
      providerId,
      failover,
      scheduler: this.schedulerService.getStatus(),
      ...settings,
    };

    this.logger.log({
      context: 'systemBackupAdmin.getSettings:success',
      enabled,
      providerId,
      failoverEnabled: failover.enabled,
      fallbackProviderId: failover.fallbackProviderId,
      scheduleMode: settings.schedule.mode,
      retentionMode: settings.retention.mode,
    });

    return response;
  }

  async updateSettings(input: SystemBackupSettings) {
    this.logger.log({
      context: 'systemBackupAdmin.updateSettings:start',
      scheduleMode: input.schedule.mode,
      retentionMode: input.retention.mode,
    });

    const settings = await this.settingsService.updateSettings(input);

    await this.schedulerService.syncSchedule(settings);
    await this.retentionService.pruneBackups(
      settings.retention.mode === 'count'
        ? {
            mode: 'count',
            maxCount: settings.retention.maxCount ?? 7,
          }
        : {
            mode: 'max_age',
            maxAgeDays: settings.retention.maxAgeDays ?? 30,
          },
    );

    this.logger.log({
      context: 'systemBackupAdmin.updateSettings:success',
      scheduleMode: settings.schedule.mode,
      retentionMode: settings.retention.mode,
    });

    return this.getSettings();
  }

  private safeParseMetadata(metadataJson?: string | null) {
    if (!metadataJson) {
      return null;
    }

    try {
      return JSON.parse(metadataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private async getFailoverStatus(primaryProviderId: string) {
    const enabled =
      this.configService.get<string>('SYSTEM_BACKUP_FAILOVER_ENABLED') ===
      'true';
    const fallbackProviderId = enabled
      ? (this.configService.get<string>('SYSTEM_BACKUP_FALLBACK_PROVIDER') ??
        null)
      : null;

    if (!enabled || !fallbackProviderId) {
      return {
        enabled: false,
        primaryProviderId,
        fallbackProviderId: null,
        lastFallbackAt: null,
        lastFallbackBackupId: null,
        lastFallbackReason: null,
      };
    }

    const jobs = await this.backupsRepository.listSuccessfulTechnicalJobs();
    const latestFallbackJob = jobs.find((job) => {
      const metadata = this.safeParseMetadata(job.metadataJson);

      return metadata?.fallbackUsed === true;
    });
    const latestFallbackMetadata = this.safeParseMetadata(
      latestFallbackJob?.metadataJson,
    );

    return {
      enabled: true,
      primaryProviderId,
      fallbackProviderId,
      lastFallbackAt: latestFallbackJob?.createdAt ?? null,
      lastFallbackBackupId: latestFallbackJob?.id ?? null,
      lastFallbackReason:
        typeof latestFallbackMetadata?.fallbackReason === 'string'
          ? latestFallbackMetadata.fallbackReason
          : null,
    };
  }
}
