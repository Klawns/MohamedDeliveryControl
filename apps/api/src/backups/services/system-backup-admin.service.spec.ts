import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupsRepository } from '../backups.repository';
import { BackupStorageRegistryService } from './backup-storage-registry.service';
import { SystemBackupAdminService } from './system-backup-admin.service';
import { SystemBackupRetentionService } from './system-backup-retention.service';
import { SystemBackupSchedulerService } from './system-backup-scheduler.service';
import { SystemBackupSettingsService } from './system-backup-settings.service';

describe('SystemBackupAdminService', () => {
  let loggerLogSpy: jest.SpyInstance;

  beforeAll(() => {
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterAll(() => {
    loggerLogSpy.mockRestore();
  });

  const createService = () => {
    const settingsService = {
      getSettings: jest.fn().mockResolvedValue({
        schedule: {
          mode: 'fixed_time',
          fixedTime: '04:00',
          intervalMinutes: null,
        },
        retention: {
          mode: 'count',
          maxCount: 7,
          maxAgeDays: null,
        },
      }),
      updateSettings: jest.fn().mockResolvedValue({
        schedule: {
          mode: 'interval',
          fixedTime: null,
          intervalMinutes: 120,
        },
        retention: {
          mode: 'max_age',
          maxCount: null,
          maxAgeDays: 15,
        },
      }),
    };
    const schedulerService = {
      getStatus: jest.fn().mockReturnValue({
        health: 'registered',
        lastSyncedAt: '2026-04-17T12:00:00.000Z',
      }),
      syncSchedule: jest.fn().mockResolvedValue(undefined),
    };
    const retentionService = {
      pruneBackups: jest.fn().mockResolvedValue(undefined),
    };
    const storageRegistry = {
      getActiveProvider: jest.fn().mockReturnValue({ id: 'rclone_drive' }),
    };
    const configService = {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'PG_DUMP_BACKUP_ENABLED'
          ? 'true'
          : key === 'SYSTEM_BACKUP_FAILOVER_ENABLED'
            ? 'true'
            : key === 'SYSTEM_BACKUP_FALLBACK_PROVIDER'
              ? 'r2'
              : fallback,
      ),
    };
    const backupsRepository = {
      listSuccessfulTechnicalJobs: jest.fn().mockResolvedValue([
        {
          id: 'tech-fallback-1',
          createdAt: new Date('2026-04-17T13:00:00.000Z'),
          metadataJson: JSON.stringify({
            fallbackUsed: true,
            fallbackReason: 'Falha ao enviar dump para o Google Drive.',
          }),
        },
      ]),
    };

    const service = new SystemBackupAdminService(
      settingsService as unknown as SystemBackupSettingsService,
      schedulerService as unknown as SystemBackupSchedulerService,
      retentionService as unknown as SystemBackupRetentionService,
      backupsRepository as unknown as BackupsRepository,
      storageRegistry as unknown as BackupStorageRegistryService,
      configService as unknown as ConfigService,
    );

    return {
      service,
      settingsService,
      schedulerService,
      retentionService,
      storageRegistry,
      backupsRepository,
    };
  };

  it('returns persisted settings together with runtime provider and scheduler status', async () => {
    const { service, storageRegistry, backupsRepository } = createService();
    loggerLogSpy.mockClear();

    const result = await service.getSettings();

    expect(storageRegistry.getActiveProvider).toHaveBeenCalled();
    expect(backupsRepository.listSuccessfulTechnicalJobs).toHaveBeenCalled();
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'systemBackupAdmin.getSettings:success',
        providerId: 'rclone_drive',
        enabled: true,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        enabled: true,
        providerId: 'rclone_drive',
        schedule: expect.objectContaining({
          mode: 'fixed_time',
          fixedTime: '04:00',
        }),
        failover: expect.objectContaining({
          enabled: true,
          primaryProviderId: 'rclone_drive',
          fallbackProviderId: 'r2',
          lastFallbackBackupId: 'tech-fallback-1',
          lastFallbackReason: 'Falha ao enviar dump para o Google Drive.',
        }),
      }),
    );
  });

  it('reapplies scheduler and retention after updating persisted settings', async () => {
    const { service, settingsService, schedulerService, retentionService } =
      createService();
    loggerLogSpy.mockClear();

    const result = await service.updateSettings({
      schedule: {
        mode: 'interval',
        fixedTime: null,
        intervalMinutes: 120,
      },
      retention: {
        mode: 'max_age',
        maxCount: null,
        maxAgeDays: 15,
      },
    });

    expect(settingsService.updateSettings).toHaveBeenCalled();
    expect(schedulerService.syncSchedule).toHaveBeenCalledWith({
      schedule: {
        mode: 'interval',
        fixedTime: null,
        intervalMinutes: 120,
      },
      retention: {
        mode: 'max_age',
        maxCount: null,
        maxAgeDays: 15,
      },
    });
    expect(retentionService.pruneBackups).toHaveBeenCalledWith({
      mode: 'max_age',
      maxAgeDays: 15,
    });
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'systemBackupAdmin.updateSettings:success',
        scheduleMode: 'interval',
        retentionMode: 'max_age',
      }),
    );
  });
});
