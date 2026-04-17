import { StreamableFile } from '@nestjs/common';
import { PassThrough } from 'node:stream';
import { AdminBackupsController } from './admin-backups.controller';
import { BackupsService } from './backups.service';
import { SystemBackupAdminService } from './services/system-backup-admin.service';

describe('AdminBackupsController', () => {
  let controller: AdminBackupsController;
  let backupsServiceMock: jest.Mocked<BackupsService>;
  let systemBackupAdminServiceMock: jest.Mocked<SystemBackupAdminService>;

  beforeEach(() => {
    backupsServiceMock = {
      listTechnicalBackups: jest.fn(),
      createManualTechnicalBackup: jest.fn(),
      getTechnicalDownloadUrl: jest.fn(),
      getTechnicalDownloadFile: jest.fn().mockResolvedValue({
        stream: new PassThrough(),
        fileName: 'technical-backup.sql.gz',
        contentType: 'application/gzip',
      }),
    } as unknown as jest.Mocked<BackupsService>;
    systemBackupAdminServiceMock = {
      getSettings: jest.fn().mockResolvedValue({
        enabled: true,
        providerId: 'rclone_drive',
        scheduler: {
          health: 'registered',
          lastSyncedAt: '2026-04-17T12:00:00.000Z',
        },
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
        failover: {
          enabled: true,
          primaryProviderId: 'rclone_drive',
          fallbackProviderId: 'r2',
          lastFallbackAt: '2026-04-17T12:10:00.000Z',
          lastFallbackBackupId: 'tech-fallback-1',
          lastFallbackReason: 'Falha ao enviar dump para o Google Drive.',
        },
      }),
      updateSettings: jest.fn().mockResolvedValue({
        enabled: true,
        providerId: 'rclone_drive',
        scheduler: {
          health: 'registered',
          lastSyncedAt: '2026-04-17T12:05:00.000Z',
        },
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
        failover: {
          enabled: true,
          primaryProviderId: 'rclone_drive',
          fallbackProviderId: 'r2',
          lastFallbackAt: '2026-04-17T12:10:00.000Z',
          lastFallbackBackupId: 'tech-fallback-1',
          lastFallbackReason: 'Falha ao enviar dump para o Google Drive.',
        },
      }),
    } as unknown as jest.Mocked<SystemBackupAdminService>;

    controller = new AdminBackupsController(
      backupsServiceMock,
      systemBackupAdminServiceMock,
    );
  });

  it('returns a streamable proxy file for technical backup downloads', async () => {
    const response = {
      setHeader: jest.fn(),
    } as any;

    const result = await controller.getTechnicalDownloadFile('tech-1', response);

    expect(backupsServiceMock.getTechnicalDownloadFile).toHaveBeenCalledWith(
      'tech-1',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/gzip',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="technical-backup.sql.gz"',
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('returns the persisted system backup settings for the admin page', async () => {
    const result = await controller.getSystemBackupSettings();

    expect(systemBackupAdminServiceMock.getSettings).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        providerId: 'rclone_drive',
        failover: expect.objectContaining({
          enabled: true,
          fallbackProviderId: 'r2',
        }),
        schedule: expect.objectContaining({
          mode: 'fixed_time',
        }),
      }),
    );
  });

  it('updates the persisted system backup settings', async () => {
    const payload = {
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
    };

    const result = await controller.updateSystemBackupSettings(payload as any);

    expect(systemBackupAdminServiceMock.updateSettings).toHaveBeenCalledWith(
      payload,
    );
    expect(result).toEqual(
      expect.objectContaining({
        schedule: expect.objectContaining({
          mode: 'interval',
        }),
      }),
    );
  });
});
