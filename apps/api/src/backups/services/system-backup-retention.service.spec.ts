import { Test, TestingModule } from '@nestjs/testing';
import { BackupsRepository } from '../backups.repository';
import { BackupStorageRegistryService } from './backup-storage-registry.service';
import { SystemBackupRetentionService } from './system-backup-retention.service';

describe('SystemBackupRetentionService', () => {
  let service: SystemBackupRetentionService;
  let repositoryMock: any;
  let registryMock: any;
  let rcloneProviderMock: any;
  let r2ProviderMock: any;

  beforeEach(async () => {
    repositoryMock = {
      listSuccessfulTechnicalJobs: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    rcloneProviderMock = {
      delete: jest.fn().mockResolvedValue(undefined),
    };
    r2ProviderMock = {
      delete: jest.fn().mockResolvedValue(undefined),
    };
    registryMock = {
      getProvider: jest.fn((providerId: string) => {
        if (providerId === 'rclone_drive') {
          return rcloneProviderMock;
        }

        if (providerId === 'r2') {
          return r2ProviderMock;
        }

        throw new Error(`Unknown provider ${providerId}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemBackupRetentionService,
        { provide: BackupsRepository, useValue: repositoryMock },
        {
          provide: BackupStorageRegistryService,
          useValue: registryMock,
        },
      ],
    }).compile();

    service = module.get(SystemBackupRetentionService);
  });

  it('prunes technical backups beyond the configured retention count using the stored provider id', async () => {
    repositoryMock.listSuccessfulTechnicalJobs.mockResolvedValue([
      {
        id: 'tech-1',
        storageKey: 'backups/technical/manual/2026-04-17/tech-1.sql.gz',
        metadataJson: JSON.stringify({ storageProviderId: 'rclone_drive' }),
        createdAt: new Date('2026-04-17T10:00:00.000Z'),
      },
      {
        id: 'tech-2',
        storageKey: 'backups/technical/manual/2026-04-16/tech-2.sql.gz',
        metadataJson: JSON.stringify({ storageProviderId: 'rclone_drive' }),
        createdAt: new Date('2026-04-16T10:00:00.000Z'),
      },
    ]);

    await service.pruneBackups({ mode: 'count', maxCount: 1 });

    expect(registryMock.getProvider).toHaveBeenCalledWith('rclone_drive');
    expect(rcloneProviderMock.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'rclone_drive',
        key: 'backups/technical/manual/2026-04-16/tech-2.sql.gz',
      }),
    );
    expect(repositoryMock.delete).toHaveBeenCalledWith('tech-2');
  });

  it('falls back to r2 for legacy technical backups without provider metadata', async () => {
    repositoryMock.listSuccessfulTechnicalJobs.mockResolvedValue([
      {
        id: 'tech-legacy-1',
        storageKey: 'backups/technical/manual/2026-04-17/tech-legacy-1.sql.gz',
        metadataJson: null,
        createdAt: new Date('2026-04-17T10:00:00.000Z'),
      },
      {
        id: 'tech-legacy-2',
        storageKey: 'backups/technical/manual/2026-04-16/tech-legacy-2.sql.gz',
        metadataJson: null,
        createdAt: new Date('2026-04-16T10:00:00.000Z'),
      },
    ]);

    await service.pruneBackups({ mode: 'count', maxCount: 1 });

    expect(registryMock.getProvider).toHaveBeenCalledWith('r2');
    expect(r2ProviderMock.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'r2',
        key: 'backups/technical/manual/2026-04-16/tech-legacy-2.sql.gz',
      }),
    );
    expect(repositoryMock.delete).toHaveBeenCalledWith('tech-legacy-2');
  });
});
