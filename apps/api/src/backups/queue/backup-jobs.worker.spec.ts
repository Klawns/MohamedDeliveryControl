/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- Jest jobs are intentionally partial. */
import { Test, TestingModule } from '@nestjs/testing';
import { BackupJobsWorker } from './backup-jobs.worker';
import { BackupsService } from '../backups.service';

describe('BackupJobsWorker', () => {
  let worker: BackupJobsWorker;
  let backupsServiceMock: any;

  beforeEach(async () => {
    backupsServiceMock = {
      processQueueJob: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupJobsWorker,
        {
          provide: BackupsService,
          useValue: backupsServiceMock,
        },
      ],
    }).compile();

    worker = module.get<BackupJobsWorker>(BackupJobsWorker);
  });

  it('should process queued backups by job id', async () => {
    await worker.process({
      id: 'bull-job-1',
      name: 'generate-functional-backup',
      data: {
        backupJobId: 'backup-job-1',
      },
    } as any);

    expect(backupsServiceMock.processQueueJob).toHaveBeenCalledWith(
      'generate-functional-backup',
      { backupJobId: 'backup-job-1' },
    );
  });
});
