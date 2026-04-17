import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import {
  BACKUPS_QUEUE,
  FUNCTIONAL_BACKUP_SCHEDULER_ID,
  RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
  RUN_TECHNICAL_BACKUP_SCHEDULE_JOB,
  TECHNICAL_BACKUP_SCHEDULER_ID,
} from './backups.constants';
import { BackupsAutomationService } from './backups-automation.service';

describe('BackupsAutomationService', () => {
  let service: BackupsAutomationService;
  let queueMock: {
    getRepeatableJobs: jest.Mock;
    getJobs: jest.Mock;
    removeRepeatableByKey: jest.Mock;
    upsertJobScheduler: jest.Mock;
    removeJobScheduler: jest.Mock;
  };
  let configValues: Record<string, string>;

  beforeEach(async () => {
    queueMock = {
      getRepeatableJobs: jest.fn().mockResolvedValue([]),
      getJobs: jest.fn().mockResolvedValue([]),
      removeRepeatableByKey: jest.fn().mockResolvedValue(true),
      upsertJobScheduler: jest.fn().mockResolvedValue(undefined),
      removeJobScheduler: jest.fn().mockResolvedValue(true),
    };

    configValues = {
      BACKUP_AUTOMATION_ENABLED: 'false',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupsAutomationService,
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

    service = module.get<BackupsAutomationService>(BackupsAutomationService);
  });

  it('should report disabled automation when the feature flag is off', async () => {
    await service.onModuleInit();

    expect(queueMock.upsertJobScheduler).not.toHaveBeenCalled();
    expect(service.getStatus()).toEqual(
      expect.objectContaining({
        health: 'disabled',
        automationEnabled: false,
        functionalRegistered: false,
      }),
    );
  });

  it('should register only the functional schedule when automation is enabled', async () => {
    configValues.BACKUP_AUTOMATION_ENABLED = 'true';
    configValues.FUNCTIONAL_BACKUP_CRON = '0 2 * * *';

    await service.onModuleInit();

    expect(queueMock.upsertJobScheduler).toHaveBeenCalledWith(
      FUNCTIONAL_BACKUP_SCHEDULER_ID,
      {
        pattern: '0 2 * * *',
      },
      {
        name: RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
        data: {},
        opts: {
          removeOnComplete: true,
        },
      },
    );
    expect(service.getStatus()).toEqual(
      expect.objectContaining({
        health: 'registered',
        automationEnabled: true,
        functionalRegistered: true,
        technicalRegistered: false,
      }),
    );
  });

  it('does not register the technical schedule anymore', async () => {
    configValues.BACKUP_AUTOMATION_ENABLED = 'true';

    await service.onModuleInit();

    expect(queueMock.upsertJobScheduler).not.toHaveBeenCalledWith(
      TECHNICAL_BACKUP_SCHEDULER_ID,
      expect.anything(),
      expect.anything(),
    );
    expect(service.getStatus()).toEqual(
      expect.objectContaining({
        health: 'registered',
        technicalRegistered: false,
      }),
    );
  });

  it('should remove legacy repeatable jobs before registering the current scheduler', async () => {
    configValues.BACKUP_AUTOMATION_ENABLED = 'true';
    queueMock.getRepeatableJobs.mockResolvedValue([
      {
        key: 'legacy:functional',
        name: RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
      },
      {
        key: 'legacy:technical',
        name: RUN_TECHNICAL_BACKUP_SCHEDULE_JOB,
      },
    ]);
    const queuedFunctionalJob = {
      id: 'queued:functional',
      name: RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
      remove: jest.fn().mockResolvedValue(undefined),
    };
    queueMock.getJobs.mockResolvedValue([queuedFunctionalJob]);

    await service.onModuleInit();

    expect(queueMock.removeRepeatableByKey).toHaveBeenCalledTimes(2);
    expect(queueMock.getJobs).toHaveBeenCalledWith(
      ['delayed', 'wait', 'waiting', 'paused', 'prioritized'],
      0,
      100,
      true,
    );
    expect(queueMock.removeRepeatableByKey).toHaveBeenNthCalledWith(
      1,
      'legacy:functional',
    );
    expect(queueMock.removeRepeatableByKey).toHaveBeenNthCalledWith(
      2,
      'legacy:technical',
    );
    expect(queuedFunctionalJob.remove).toHaveBeenCalled();
    expect(queueMock.upsertJobScheduler).toHaveBeenCalledWith(
      FUNCTIONAL_BACKUP_SCHEDULER_ID,
      {
        pattern: '0 3 * * *',
      },
      {
        name: RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
        data: {},
        opts: {
          removeOnComplete: true,
        },
      },
    );
  });
});
