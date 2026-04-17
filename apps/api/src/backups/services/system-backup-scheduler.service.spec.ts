import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import {
  BACKUPS_QUEUE,
  RUN_TECHNICAL_BACKUP_SCHEDULE_JOB,
  TECHNICAL_BACKUP_SCHEDULER_ID,
} from '../backups.constants';
import { SystemBackupSchedulerService } from './system-backup-scheduler.service';
import { SystemBackupSettingsService } from './system-backup-settings.service';

describe('SystemBackupSchedulerService', () => {
  let service: SystemBackupSchedulerService;
  let queueMock: any;
  let settingsServiceMock: any;
  let configValues: Record<string, string>;
  let loggerLogSpy: jest.SpyInstance;

  beforeAll(() => {
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterAll(() => {
    loggerLogSpy.mockRestore();
  });

  beforeEach(async () => {
    loggerLogSpy.mockClear();
    queueMock = {
      upsertJobScheduler: jest.fn().mockResolvedValue(undefined),
      removeJobScheduler: jest.fn().mockResolvedValue(undefined),
    };
    settingsServiceMock = {
      getSettings: jest.fn().mockResolvedValue({
        schedule: {
          mode: 'fixed_time',
          fixedTime: '04:30',
          intervalMinutes: null,
        },
        retention: {
          mode: 'count',
          maxCount: 7,
          maxAgeDays: null,
        },
      }),
    };
    configValues = {
      PG_DUMP_BACKUP_ENABLED: 'true',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemBackupSchedulerService,
        {
          provide: SystemBackupSettingsService,
          useValue: settingsServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) =>
              key in configValues ? configValues[key] : fallback,
            ),
          },
        },
        {
          provide: getQueueToken(BACKUPS_QUEUE),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get(SystemBackupSchedulerService);
  });

  it('registers a fixed-time technical scheduler from persisted settings', async () => {
    await service.syncSchedule();

    expect(queueMock.upsertJobScheduler).toHaveBeenCalledWith(
      TECHNICAL_BACKUP_SCHEDULER_ID,
      { pattern: '30 4 * * *' },
      {
        name: RUN_TECHNICAL_BACKUP_SCHEDULE_JOB,
        data: {},
        opts: {
          removeOnComplete: true,
        },
      },
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'systemBackupScheduler.syncSchedule:success',
        mode: 'fixed_time',
        schedulerHealth: 'registered',
      }),
    );
  });

  it('registers an interval scheduler when the persisted mode is interval', async () => {
    settingsServiceMock.getSettings.mockResolvedValue({
      schedule: {
        mode: 'interval',
        fixedTime: null,
        intervalMinutes: 180,
      },
      retention: {
        mode: 'count',
        maxCount: 7,
        maxAgeDays: null,
      },
    });

    await service.syncSchedule();

    expect(queueMock.upsertJobScheduler).toHaveBeenCalledWith(
      TECHNICAL_BACKUP_SCHEDULER_ID,
      { every: 180 * 60 * 1000 },
      expect.any(Object),
    );
  });

  it('removes the scheduler when pg_dump backups are globally disabled', async () => {
    configValues.PG_DUMP_BACKUP_ENABLED = 'false';

    await service.syncSchedule();

    expect(queueMock.removeJobScheduler).toHaveBeenCalledWith(
      TECHNICAL_BACKUP_SCHEDULER_ID,
    );
    expect(queueMock.upsertJobScheduler).not.toHaveBeenCalled();
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'systemBackupScheduler.syncSchedule:disabledByEnv',
      }),
    );
  });
});
