/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Jest mocks are intentionally partial. */
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { STORAGE_PROVIDER } from '../../storage/interfaces/storage-provider.interface';
import { BackupsRepository } from '../backups.repository';
import {
  BACKUPS_QUEUE,
  GENERATE_FUNCTIONAL_BACKUP_JOB,
  GENERATE_TECHNICAL_BACKUP_JOB,
  RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
} from '../backups.constants';
import { BackupJobOrchestratorService } from './backup-job-orchestrator.service';
import { BackupRetentionService } from './backup-retention.service';
import { BackupStorageRegistryService } from './backup-storage-registry.service';
import { FunctionalBackupArchiveService } from './functional-backup-archive.service';
import { SystemBackupRetentionService } from './system-backup-retention.service';
import { SystemBackupSettingsService } from './system-backup-settings.service';
import { TechnicalBackupRunnerService } from './technical-backup-runner.service';

describe('BackupJobOrchestratorService', () => {
  let service: BackupJobOrchestratorService;
  let repositoryMock: any;
  let queueMock: any;
  let storageProviderMock: any;
  let systemBackupProviderMock: any;
  let backupStorageRegistryMock: any;
  let archiveServiceMock: any;
  let technicalRunnerMock: any;
  let usersServiceMock: any;
  let backupRetentionServiceMock: any;
  let systemBackupRetentionServiceMock: any;
  let systemBackupSettingsServiceMock: any;
  let configValues: Record<string, unknown>;
  let loggerLogSpy: jest.SpyInstance;

  beforeAll(() => {
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterAll(() => {
    loggerLogSpy.mockRestore();
  });

  beforeEach(async () => {
    loggerLogSpy.mockClear();

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
      findById: jest.fn(),
      markRunning: jest.fn().mockResolvedValue(undefined),
      markSuccess: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      createScheduledFunctionalJob: jest
        .fn()
        .mockResolvedValue({ id: 'job-sched-1' }),
    };

    queueMock = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    storageProviderMock = {
      uploadPrivate: jest.fn().mockResolvedValue({
        key: 'backups/user/job-1.zip',
      }),
    };

    systemBackupProviderMock = {
      id: 'rclone_drive',
      upload: jest.fn().mockResolvedValue({
        providerId: 'rclone_drive',
        key: 'backups/technical/manual/2026-04-17/tech-1.sql.gz',
        fileName: 'technical-backup-2026-04-17T12-00-00-000Z.sql.gz',
        contentType: 'application/gzip',
      }),
    };

    backupStorageRegistryMock = {
      getActiveProvider: jest.fn().mockReturnValue(systemBackupProviderMock),
      getProvider: jest.fn((providerId: string) => {
        if (providerId === 'rclone_drive') {
          return systemBackupProviderMock;
        }

        if (providerId === 'r2') {
          return {
            id: 'r2',
            upload: jest.fn().mockResolvedValue({
              providerId: 'r2',
              key: 'backups/technical/manual/2026-04-17/tech-1.r2-fallback.sql.gz',
              fileName:
                'technical-backup-r2-fallback-2026-04-17T12-00-00-000Z.sql.gz',
              contentType: 'application/gzip',
            }),
          };
        }

        throw new Error(`Unknown provider ${providerId}`);
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

    technicalRunnerMock = {
      createDumpBuffer: jest.fn().mockResolvedValue({
        dumpBuffer: Buffer.from('technical-dump'),
        contentType: 'application/gzip',
        rawSizeBytes: 42,
      }),
    };

    usersServiceMock = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]),
    };

    backupRetentionServiceMock = {
      pruneFunctionalBackups: jest.fn().mockResolvedValue(undefined),
    };

    systemBackupRetentionServiceMock = {
      pruneBackups: jest.fn().mockResolvedValue(undefined),
    };

    systemBackupSettingsServiceMock = {
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
    };

    configValues = {
      BACKUP_RETENTION_COUNT: 7,
      TECHNICAL_BACKUP_RETENTION_COUNT: 7,
      BACKUP_STORAGE_PREFIX: 'backups',
      SYSTEM_BACKUP_FAILOVER_ENABLED: 'false',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupJobOrchestratorService,
        { provide: BackupsRepository, useValue: repositoryMock },
        { provide: UsersService, useValue: usersServiceMock },
        {
          provide: FunctionalBackupArchiveService,
          useValue: archiveServiceMock,
        },
        {
          provide: TechnicalBackupRunnerService,
          useValue: technicalRunnerMock,
        },
        {
          provide: BackupRetentionService,
          useValue: backupRetentionServiceMock,
        },
        {
          provide: SystemBackupRetentionService,
          useValue: systemBackupRetentionServiceMock,
        },
        {
          provide: BackupStorageRegistryService,
          useValue: backupStorageRegistryMock,
        },
        {
          provide: SystemBackupSettingsService,
          useValue: systemBackupSettingsServiceMock,
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

    service = module.get<BackupJobOrchestratorService>(
      BackupJobOrchestratorService,
    );
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

  it('should process queued functional jobs and apply retention', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 'job-1',
      scopeUserId: 'user-1',
      trigger: 'manual',
      status: 'pending',
    });

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
    expect(
      backupRetentionServiceMock.pruneFunctionalBackups,
    ).toHaveBeenCalledWith('user-1', 7);
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

  it('should process queued technical jobs through the active system backup provider and persist provider metadata', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 'tech-1',
      kind: 'technical_full',
      trigger: 'manual',
      status: 'pending',
      createdAt: new Date('2026-04-17T12:00:00.000Z'),
    });

    await service.processQueueJob(GENERATE_TECHNICAL_BACKUP_JOB, {
      backupJobId: 'tech-1',
    });

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'processTechnicalBackupJob:start',
        backupJobId: 'tech-1',
        providerId: 'rclone_drive',
      }),
    );
    expect(backupStorageRegistryMock.getActiveProvider).toHaveBeenCalled();
    expect(systemBackupProviderMock.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        buffer: Buffer.from('technical-dump'),
        contentType: 'application/gzip',
      }),
      'backups/technical/manual/2026-04-17/tech-1.sql.gz',
    );
    expect(repositoryMock.markSuccess).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({
        storageKey: 'backups/technical/manual/2026-04-17/tech-1.sql.gz',
        metadataJson: expect.stringContaining('"storageProviderId":"rclone_drive"'),
      }),
    );
    expect(systemBackupRetentionServiceMock.pruneBackups).toHaveBeenCalledWith({
      mode: 'count',
      maxCount: 7,
    });
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'processTechnicalBackupJob:success',
        backupJobId: 'tech-1',
        providerId: 'rclone_drive',
        storageKey: 'backups/technical/manual/2026-04-17/tech-1.sql.gz',
      }),
    );
  });

  it('stores an explicit technical backup error when pg_dump is unavailable in the API runtime', async () => {
    repositoryMock.findById.mockResolvedValue({
      id: 'tech-1',
      kind: 'technical_full',
      trigger: 'manual',
      status: 'pending',
      createdAt: new Date('2026-04-17T12:00:00.000Z'),
    });
    technicalRunnerMock.createDumpBuffer.mockRejectedValue(
      new Error(
        'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL, configure PG_DUMP_BINARY ou habilite PG_DUMP_EXECUTION_MODE=auto/docker_compose com PG_DUMP_DOCKER_COMPOSE_SERVICE.',
      ),
    );

    await expect(
      service.processQueueJob(GENERATE_TECHNICAL_BACKUP_JOB, {
        backupJobId: 'tech-1',
      }),
    ).rejects.toThrow(
      'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL, configure PG_DUMP_BINARY ou habilite PG_DUMP_EXECUTION_MODE=auto/docker_compose com PG_DUMP_DOCKER_COMPOSE_SERVICE.',
    );

    expect(repositoryMock.markFailed).toHaveBeenCalledWith(
      'tech-1',
      'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL, configure PG_DUMP_BINARY ou habilite PG_DUMP_EXECUTION_MODE=auto/docker_compose com PG_DUMP_DOCKER_COMPOSE_SERVICE.',
    );
  });

  it('falls back to r2 on upload runtime failure, persists fallback metadata and renames the backup artifact', async () => {
    configValues.SYSTEM_BACKUP_FAILOVER_ENABLED = 'true';
    configValues.SYSTEM_BACKUP_FALLBACK_PROVIDER = 'r2';
    repositoryMock.findById.mockResolvedValue({
      id: 'tech-1',
      kind: 'technical_full',
      trigger: 'manual',
      status: 'pending',
      createdAt: new Date('2026-04-17T12:00:00.000Z'),
    });
    systemBackupProviderMock.upload.mockRejectedValueOnce(
      new Error('Falha ao enviar dump para o Google Drive.'),
    );

    await service.processQueueJob(GENERATE_TECHNICAL_BACKUP_JOB, {
      backupJobId: 'tech-1',
    });

    expect(systemBackupProviderMock.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'technical-backup-2026-04-17T12-00-00-000Z.sql.gz',
      }),
      'backups/technical/manual/2026-04-17/tech-1.sql.gz',
    );
    expect(backupStorageRegistryMock.getProvider).toHaveBeenCalledWith('r2');
    expect(repositoryMock.markSuccess).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({
        storageKey:
          'backups/technical/manual/2026-04-17/tech-1.r2-fallback.sql.gz',
        metadataJson: expect.stringContaining('"requestedStorageProviderId":"rclone_drive"'),
      }),
    );
    expect(repositoryMock.markSuccess).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({
        metadataJson: expect.stringContaining('"storageProviderId":"r2"'),
      }),
    );
    expect(repositoryMock.markSuccess).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({
        metadataJson: expect.stringContaining('"fallbackUsed":true'),
      }),
    );
    expect(repositoryMock.markSuccess).toHaveBeenCalledWith(
      'tech-1',
      expect.objectContaining({
        metadataJson: expect.stringContaining(
          '"displayFileName":"technical-backup-r2-fallback-2026-04-17T12-00-00-000Z.sql.gz"',
        ),
      }),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'processTechnicalBackupJob:fallbackSuccess',
        backupJobId: 'tech-1',
        fallbackProviderId: 'r2',
      }),
    );
  });

  it('does not trigger provider failover when dump generation fails before upload', async () => {
    configValues.SYSTEM_BACKUP_FAILOVER_ENABLED = 'true';
    configValues.SYSTEM_BACKUP_FALLBACK_PROVIDER = 'r2';
    repositoryMock.findById.mockResolvedValue({
      id: 'tech-1',
      kind: 'technical_full',
      trigger: 'manual',
      status: 'pending',
      createdAt: new Date('2026-04-17T12:00:00.000Z'),
    });
    technicalRunnerMock.createDumpBuffer.mockRejectedValue(
      new Error(
        'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL, configure PG_DUMP_BINARY ou habilite PG_DUMP_EXECUTION_MODE=auto/docker_compose com PG_DUMP_DOCKER_COMPOSE_SERVICE.',
      ),
    );

    await expect(
      service.processQueueJob(GENERATE_TECHNICAL_BACKUP_JOB, {
        backupJobId: 'tech-1',
      }),
    ).rejects.toThrow('pg_dump nao foi encontrado');

    expect(backupStorageRegistryMock.getProvider).not.toHaveBeenCalledWith('r2');
  });

  it('should raise a service unavailable error when technical backup schema is missing during creation', async () => {
    repositoryMock.createTechnicalJob.mockRejectedValue(
      new Error(
        'invalid input value for enum backup_job_kind: "technical_full"',
      ),
    );

    await expect(
      service.createManualTechnicalBackup('admin-1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should enqueue scheduled functional backups for all users', async () => {
    repositoryMock.createScheduledFunctionalJob
      .mockResolvedValueOnce({ id: 'job-sched-1' })
      .mockResolvedValueOnce({ id: 'job-sched-2' });

    await service.processQueueJob(RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB, {});

    expect(usersServiceMock.findAll).toHaveBeenCalled();
    expect(repositoryMock.createScheduledFunctionalJob).toHaveBeenNthCalledWith(
      1,
      'user-1',
    );
    expect(repositoryMock.createScheduledFunctionalJob).toHaveBeenNthCalledWith(
      2,
      'user-2',
    );
    expect(queueMock.add).toHaveBeenNthCalledWith(
      1,
      GENERATE_FUNCTIONAL_BACKUP_JOB,
      { backupJobId: 'job-sched-1' },
      expect.any(Object),
    );
    expect(queueMock.add).toHaveBeenNthCalledWith(
      2,
      GENERATE_FUNCTIONAL_BACKUP_JOB,
      { backupJobId: 'job-sched-2' },
      expect.any(Object),
    );
  });
});
