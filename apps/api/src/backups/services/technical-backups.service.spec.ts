/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Jest mocks are intentionally partial. */
import {
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PassThrough } from 'node:stream';
import { BackupsRepository } from '../backups.repository';
import { BackupJobOrchestratorService } from './backup-job-orchestrator.service';
import { BackupStorageRegistryService } from './backup-storage-registry.service';
import { TechnicalBackupsService } from './technical-backups.service';

describe('TechnicalBackupsService', () => {
  let service: TechnicalBackupsService;
  let repositoryMock: any;
  let orchestratorMock: any;
  let backupStorageRegistryMock: any;
  let configValues: Record<string, unknown>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterAll(() => {
    loggerLogSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  beforeEach(async () => {
    loggerLogSpy.mockClear();
    loggerWarnSpy.mockClear();

    repositoryMock = {
      listTechnicalJobs: jest.fn().mockResolvedValue([]),
      findTechnicalJob: jest.fn(),
    };

    orchestratorMock = {
      createManualTechnicalBackup: jest.fn().mockResolvedValue({
        id: 'tech-1',
        kind: 'technical_full',
        trigger: 'manual',
        status: 'pending',
        manifestVersion: 1,
        createdAt: new Date('2026-03-31T12:00:00.000Z'),
      }),
    };

    backupStorageRegistryMock = {
      getProvider: jest.fn().mockReturnValue({
        download: jest.fn().mockResolvedValue(new PassThrough()),
      }),
    };

    configValues = {
      BACKUP_HISTORY_LIMIT: 7,
      BACKUP_SIGNED_URL_TTL_SECONDS: 300,
      PG_DUMP_BACKUP_ENABLED: 'true',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalBackupsService,
        { provide: BackupsRepository, useValue: repositoryMock },
        {
          provide: BackupJobOrchestratorService,
          useValue: orchestratorMock,
        },
        {
          provide: BackupStorageRegistryService,
          useValue: backupStorageRegistryMock,
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

    service = module.get<TechnicalBackupsService>(TechnicalBackupsService);
  });

  it('should create a manual technical backup via the orchestrator', async () => {
    const result = await service.createManualBackup('admin-1');

    expect(orchestratorMock.createManualTechnicalBackup).toHaveBeenCalledWith(
      'admin-1',
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'technicalBackups.createManualBackup:start',
        actorUserId: 'admin-1',
      }),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'technicalBackups.createManualBackup:success',
        actorUserId: 'admin-1',
        backupJobId: 'tech-1',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'tech-1',
        status: 'pending',
      }),
    );
  });

  it('blocks manual technical backups when pg_dump backup is disabled', async () => {
    configValues.PG_DUMP_BACKUP_ENABLED = 'false';

    await expect(service.createManualBackup('admin-1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(orchestratorMock.createManualTechnicalBackup).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'technicalBackups.createManualBackup:disabled',
        actorUserId: 'admin-1',
      }),
    );
  });

  it('should translate schema errors when listing technical backups', async () => {
    repositoryMock.listTechnicalJobs.mockRejectedValue(
      new Error(
        'invalid input value for enum backup_job_kind: "technical_full"',
      ),
    );

    await expect(service.listBackups()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns the persisted technical backup error message for failed jobs', async () => {
    repositoryMock.listTechnicalJobs.mockResolvedValue([
      {
        id: 'tech-1',
        kind: 'technical_full',
        trigger: 'manual',
        status: 'failed',
        checksum: null,
        sizeBytes: null,
        manifestVersion: 1,
        errorMessage:
          'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL.',
        createdAt: new Date('2026-03-31T12:00:00.000Z'),
        startedAt: new Date('2026-03-31T12:00:05.000Z'),
        finishedAt: new Date('2026-03-31T12:00:06.000Z'),
        metadataJson: null,
      },
    ]);

    const result = await service.listBackups();

    expect(result).toEqual([
      expect.objectContaining({
        id: 'tech-1',
        status: 'failed',
        errorMessage:
          'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL.',
      }),
    ]);
  });

  it('returns warnings and display name when a successful technical backup used provider fallback', async () => {
    repositoryMock.listTechnicalJobs.mockResolvedValue([
      {
        id: 'tech-1',
        kind: 'technical_full',
        trigger: 'manual',
        status: 'success',
        checksum: 'checksum-1',
        sizeBytes: 1024,
        manifestVersion: 1,
        errorMessage: null,
        createdAt: new Date('2026-03-31T12:00:00.000Z'),
        startedAt: new Date('2026-03-31T12:00:05.000Z'),
        finishedAt: new Date('2026-03-31T12:00:06.000Z'),
        metadataJson: JSON.stringify({
          storageProviderId: 'r2',
          displayFileName:
            'technical-backup-r2-fallback-2026-03-31T12-00-00-000Z.sql.gz',
          fallbackUsed: true,
          fallbackFromProviderId: 'rclone_drive',
          fallbackReason: 'Falha ao enviar dump para o Google Drive.',
        }),
      },
    ]);

    const result = await service.listBackups();

    expect(result).toEqual([
      expect.objectContaining({
        id: 'tech-1',
        status: 'success',
        displayName:
          'technical-backup-r2-fallback-2026-03-31T12-00-00-000Z.sql.gz',
        warnings: [
          'Upload concluido via fallback no provider r2 apos falha no provider rclone_drive.',
        ],
      }),
    ]);
  });

  it('should return an internal proxy download URL for a completed technical backup', async () => {
    repositoryMock.findTechnicalJob.mockResolvedValue({
      id: 'tech-1',
      status: 'success',
      storageKey: 'backups/technical/manual/2026-03-31/tech-1.sql.gz',
      createdAt: new Date('2026-03-31T12:00:00.000Z'),
    });

    const result = await service.getDownloadUrl('tech-1');

    expect(result).toEqual({
      id: 'tech-1',
      url: '/api/admin/backups/technical/tech-1/file',
      expiresInSeconds: 300,
    });
  });

  it('should reject downloads for backups that are not ready', async () => {
    repositoryMock.findTechnicalJob.mockResolvedValue({
      id: 'tech-1',
      status: 'pending',
      storageKey: null,
      createdAt: new Date('2026-03-31T12:00:00.000Z'),
    });

    await expect(service.getDownloadUrl('tech-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('opens a proxy download stream using the stored backup provider metadata', async () => {
    const stream = new PassThrough();
    repositoryMock.findTechnicalJob.mockResolvedValue({
      id: 'tech-1',
      status: 'success',
      storageKey: 'backups/technical/manual/2026-03-31/tech-1.sql.gz',
      metadataJson: JSON.stringify({
        storageProviderId: 'rclone_drive',
        storageFileName: 'technical-backup-2026-03-31T12-00-00-000Z.sql.gz',
        storageContentType: 'application/gzip',
      }),
      createdAt: new Date('2026-03-31T12:00:00.000Z'),
    });
    backupStorageRegistryMock.getProvider.mockReturnValue({
      download: jest.fn().mockResolvedValue(stream),
    });

    const result = await service.getDownloadFile('tech-1');

    expect(backupStorageRegistryMock.getProvider).toHaveBeenCalledWith(
      'rclone_drive',
    );
    expect(result).toEqual(
      expect.objectContaining({
        fileName: 'technical-backup-2026-03-31T12-00-00-000Z.sql.gz',
        contentType: 'application/gzip',
      }),
    );
    expect(result.stream).toBe(stream);
  });

  it('should raise not found when the technical backup does not exist', async () => {
    repositoryMock.findTechnicalJob.mockResolvedValue(null);

    await expect(service.getDownloadUrl('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
