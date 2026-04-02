/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument -- Jest mocks are intentionally partial. */
import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { STORAGE_PROVIDER } from '../storage/interfaces/storage-provider.interface';
import { BackupsAutomationService } from './backups-automation.service';
import { BackupsRepository } from './backups.repository';
import { BackupsService } from './backups.service';
import { FunctionalBackupArchiveService } from './services/functional-backup-archive.service';
import { FunctionalBackupImportService } from './services/functional-backup-import.service';
import { TechnicalBackupRunnerService } from './services/technical-backup-runner.service';
import {
  BACKUPS_QUEUE,
  GENERATE_FUNCTIONAL_BACKUP_JOB,
  GENERATE_TECHNICAL_BACKUP_JOB,
} from './backups.constants';

describe('BackupsService', () => {
  let service: BackupsService;
  let repositoryMock: any;
  let queueMock: any;
  let storageProviderMock: any;
  let backupsAutomationServiceMock: any;
  let archiveServiceMock: any;
  let importServiceMock: any;
  let technicalRunnerMock: any;
  let usersServiceMock: any;
  let configValues: Record<string, unknown>;

  beforeEach(async () => {
    repositoryMock = {
      createManualFunctionalJob: jest.fn().mockResolvedValue({
        id: 'job-1',
        kind: 'functional_user',
        trigger: 'manual',
        status: 'pending',
        manifestVersion: 1,
        createdAt: new Date('2026-03-31T12:00:00.000Z'),
      }),
      createTechnicalJob: jest.fn().mockResolvedValue({
        id: 'tech-1',
        kind: 'technical_full',
        trigger: 'manual',
        status: 'pending',
        manifestVersion: 1,
        createdAt: new Date('2026-03-31T12:00:00.000Z'),
      }),
      listUserJobs: jest.fn().mockResolvedValue([]),
      listTechnicalJobs: jest.fn().mockResolvedValue([]),
      findUserJob: jest.fn(),
      findTechnicalJob: jest.fn(),
      findById: jest.fn(),
      markRunning: jest.fn().mockResolvedValue(undefined),
      markSuccess: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      listSuccessfulFunctionalJobs: jest.fn().mockResolvedValue([]),
      listSuccessfulTechnicalJobs: jest.fn().mockResolvedValue([]),
      createScheduledFunctionalJob: jest.fn().mockResolvedValue({ id: 'job-sched-1' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    queueMock = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    storageProviderMock = {
      uploadPrivate: jest.fn().mockResolvedValue({
        key: 'backups/user/job-1.zip',
      }),
      getSignedUrl: jest
        .fn()
        .mockResolvedValue('https://signed.example.com/job-1'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    backupsAutomationServiceMock = {
      getStatus: jest.fn().mockReturnValue({
        health: 'disabled',
        automationEnabled: false,
        functionalCron: '0 3 * * *',
        technicalCron: '0 4 * * *',
        functionalRegistered: false,
        technicalRegistered: false,
        lastCheckedAt: '2026-03-31T12:00:00.000Z',
      }),
    };

    archiveServiceMock = {
      buildArchive: jest.fn().mockResolvedValue({
        archiveBuffer: Buffer.from('zip-content'),
        archiveChecksum:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        sizeBytes: 11,
        manifest: {
          createdAt: '2026-03-31T12:00:00.000Z',
          ownerUserId: 'user-1',
          ownerName: 'Alice Motorista',
          modules: ['clients'],
          counts: { clients: 1 },
          sha256:
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      }),
    };

    importServiceMock = {
      previewImport: jest.fn(),
      getImportStatus: jest.fn(),
      executeImport: jest.fn(),
    };

    technicalRunnerMock = {
      createDumpBuffer: jest.fn().mockResolvedValue({
        dumpBuffer: Buffer.from('technical-dump'),
        contentType: 'application/gzip',
        rawSizeBytes: 42,
      }),
    };

    usersServiceMock = {
      findAll: jest.fn().mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]),
    };

    configValues = {
      BACKUP_RETENTION_COUNT: 7,
      BACKUP_HISTORY_LIMIT: 7,
      TECHNICAL_BACKUP_RETENTION_COUNT: 7,
      BACKUP_SIGNED_URL_TTL_SECONDS: 300,
      BACKUP_STORAGE_PREFIX: 'backups',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupsService,
        { provide: BackupsRepository, useValue: repositoryMock },
        {
          provide: BackupsAutomationService,
          useValue: backupsAutomationServiceMock,
        },
        {
          provide: FunctionalBackupArchiveService,
          useValue: archiveServiceMock,
        },
        {
          provide: FunctionalBackupImportService,
          useValue: importServiceMock,
        },
        {
          provide: TechnicalBackupRunnerService,
          useValue: technicalRunnerMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: getQueueToken(BACKUPS_QUEUE),
          useValue: queueMock,
        },
        {
          provide: STORAGE_PROVIDER,
          useValue: storageProviderMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) =>
              key in configValues ? configValues[key] : fallback,
            ),
          },
        },
      ],
    }).compile();

    service = module.get<BackupsService>(BackupsService);
  });

  it('should enqueue a manual functional backup', async () => {
    const result = await service.createManualFunctionalBackup('user-1');

    expect(repositoryMock.createManualFunctionalJob).toHaveBeenCalledWith(
      'user-1',
    );
    expect(queueMock.add).toHaveBeenCalledWith(
      GENERATE_FUNCTIONAL_BACKUP_JOB,
      { backupJobId: 'job-1' },
      expect.any(Object),
    );
    expect(result.id).toBe('job-1');
    expect(result.status).toBe('pending');
  });

  it('should return a signed download URL for completed user backups', async () => {
    repositoryMock.findUserJob.mockResolvedValue({
      id: 'job-1',
      status: 'success',
      storageKey: 'backups/user-1/2026-03-31/job-1.zip',
      createdAt: new Date('2026-03-31T12:00:00.000Z'),
    });

    const result = await service.getDownloadUrl('user-1', 'job-1');

    expect(storageProviderMock.getSignedUrl).toHaveBeenCalledWith(
      'backups/user-1/2026-03-31/job-1.zip',
      expect.objectContaining({
        visibility: 'private',
      }),
    );
    expect(result.url).toBe('https://signed.example.com/job-1');
  });

  it('should process queued functional jobs and apply retention', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 'job-1',
      scopeUserId: 'user-1',
      trigger: 'manual',
      status: 'pending',
    });
    repositoryMock.listSuccessfulFunctionalJobs.mockResolvedValue([
      { id: 'job-1', storageKey: 'backups/user-1/manual/2026-03-31/job-1.zip' },
      { id: 'job-2', storageKey: 'backups/user-1/manual/2026-03-30/job-2.zip' },
      { id: 'job-3', storageKey: 'backups/user-1/manual/2026-03-29/job-3.zip' },
      { id: 'job-4', storageKey: 'backups/user-1/manual/2026-03-28/job-4.zip' },
      { id: 'job-5', storageKey: 'backups/user-1/manual/2026-03-27/job-5.zip' },
      { id: 'job-6', storageKey: 'backups/user-1/manual/2026-03-26/job-6.zip' },
      { id: 'job-7', storageKey: 'backups/user-1/manual/2026-03-25/job-7.zip' },
      { id: 'job-8', storageKey: 'backups/user-1/manual/2026-03-24/job-8.zip' },
    ]);

    await service.processQueueJob(GENERATE_FUNCTIONAL_BACKUP_JOB, {
      backupJobId: 'job-1',
    });

    expect(repositoryMock.markRunning).toHaveBeenCalledWith('job-1');
    expect(archiveServiceMock.buildArchive).toHaveBeenCalledWith('user-1');
    expect(storageProviderMock.uploadPrivate).toHaveBeenCalled();
    expect(repositoryMock.markSuccess).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        checksum:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),
    );
    expect(storageProviderMock.delete).toHaveBeenCalledWith(
      'backups/user-1/manual/2026-03-24/job-8.zip',
      { visibility: 'private' },
    );
    expect(repositoryMock.delete).toHaveBeenCalledWith('job-8');
  });

  it('should enqueue a manual technical backup', async () => {
    const result = await service.createManualTechnicalBackup('admin-1');

    expect(repositoryMock.createTechnicalJob).toHaveBeenCalledWith(
      'manual',
      'admin-1',
    );
    expect(queueMock.add).toHaveBeenCalledWith(
      GENERATE_TECHNICAL_BACKUP_JOB,
      { backupJobId: 'tech-1' },
      expect.any(Object),
    );
    expect(result.id).toBe('tech-1');
  });

  it('should list backups using the configured history limit', async () => {
    await service.listUserBackups('user-1');

    expect(repositoryMock.listUserJobs).toHaveBeenCalledWith('user-1', 7);
  });

  it('should raise a service unavailable error when technical backup schema is missing', async () => {
    repositoryMock.listTechnicalJobs.mockRejectedValue(
      new Error('invalid input value for enum backup_job_kind: "technical_full"'),
    );

    await expect(service.listTechnicalBackups()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should expose the current backup automation status', () => {
    const result = service.getUserBackupStatus();

    expect(backupsAutomationServiceMock.getStatus).toHaveBeenCalled();
    expect(result).toEqual({
      automation: expect.objectContaining({
        health: 'disabled',
        automationEnabled: false,
      }),
      historyLimit: 7,
      retentionCount: 7,
    });
  });

  it('should proxy functional import status requests', async () => {
    importServiceMock.getImportStatus.mockResolvedValue({
      id: 'import-job-1',
      status: 'running',
      phase: 'backing_up',
    });

    const result = await service.getFunctionalImportStatus(
      'user-1',
      'import-job-1',
    );

    expect(importServiceMock.getImportStatus).toHaveBeenCalledWith(
      'user-1',
      'import-job-1',
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'import-job-1',
        phase: 'backing_up',
      }),
    );
  });
});
