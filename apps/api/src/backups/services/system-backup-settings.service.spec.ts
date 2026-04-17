/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Drizzle mocks are intentionally dynamic in these unit tests. */
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '../../database/database.provider';
import { SystemBackupSettingsService } from './system-backup-settings.service';

describe('SystemBackupSettingsService', () => {
  function createService(
    configs: Array<{ key: string; value: string }> = [],
    selectMode: 'list' | 'where' = 'list',
  ) {
    const selectWhereMock = jest.fn();
    const updateWhereMock = jest.fn().mockResolvedValue(undefined);
    const insertValuesMock = jest.fn().mockResolvedValue(undefined);
    const selectFromMock = jest.fn(() =>
      selectMode === 'list'
        ? configs
        : {
            where: selectWhereMock,
          },
    );

    selectWhereMock.mockResolvedValue([]);

    const drizzle = {
      db: {
        select: jest.fn().mockReturnValue({
          from: selectFromMock,
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: updateWhereMock,
          }),
        }),
        insert: jest.fn().mockReturnValue({
          values: insertValuesMock,
        }),
      },
      schema: {
        systemConfigs: {
          key: 'key',
        },
      },
    };

    const service = new SystemBackupSettingsService(
      drizzle as any,
      {
        get: jest.fn((key: string, fallback?: unknown) => {
          if (key === 'TECHNICAL_BACKUP_CRON') {
            return '0 4 * * *';
          }

          if (key === 'TECHNICAL_BACKUP_RETENTION_COUNT') {
            return 7;
          }

          return fallback;
        }),
      } as unknown as ConfigService,
    );

    return {
      service,
      drizzle,
      selectWhereMock,
      insertValuesMock,
    };
  }

  it('returns sane defaults when no persisted settings exist', async () => {
    const { service } = createService([], 'list');

    const result = await service.getSettings();

    expect(result).toEqual({
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
    });
  });

  it('persists the typed system backup settings into system_configs', async () => {
    const { service, insertValuesMock } = createService([], 'where');
    jest.spyOn(service, 'getSettings').mockResolvedValue({
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

    await service.updateSettings({
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

    expect(insertValuesMock).toHaveBeenCalled();
  });

  it('rejects invalid interval settings before persisting', async () => {
    const { service } = createService([], 'where');

    await expect(
      service.updateSettings({
        schedule: {
          mode: 'interval',
          fixedTime: null,
          intervalMinutes: null,
        },
        retention: {
          mode: 'count',
          maxCount: 7,
          maxAgeDays: null,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
