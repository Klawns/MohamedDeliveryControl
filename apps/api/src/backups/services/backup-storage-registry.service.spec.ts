import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BACKUP_STORAGE_PROVIDERS,
  type BackupStorageProvider,
} from '../interfaces/backup-storage-provider.interface';
import { BackupStorageRegistryService } from './backup-storage-registry.service';

describe('BackupStorageRegistryService', () => {
  const createProvider = (id: string): BackupStorageProvider => ({
    id,
    upload: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
  });

  async function createService(
    providerIds: string[],
    activeProvider = 'r2',
  ): Promise<BackupStorageRegistryService> {
    const providers = providerIds.map(createProvider);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupStorageRegistryService,
        {
          provide: BACKUP_STORAGE_PROVIDERS,
          useValue: providers,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) =>
              key === 'SYSTEM_BACKUP_PROVIDER' ? activeProvider : fallback,
            ),
          },
        },
      ],
    }).compile();

    return module.get(BackupStorageRegistryService);
  }

  it('returns the configured active provider', async () => {
    const service = await createService(['r2', 'rclone_drive'], 'rclone_drive');

    expect(service.getActiveProvider().id).toBe('rclone_drive');
  });

  it('resolves explicit providers independently from the active provider', async () => {
    const service = await createService(['r2', 'rclone_drive'], 'rclone_drive');

    expect(service.getProvider('r2').id).toBe('r2');
  });

  it('fails with a clear error when the active provider is unavailable', async () => {
    const service = await createService(['r2'], 'rclone_drive');

    expect(() => service.getActiveProvider()).toThrow(
      'Provider de backup sistêmico "rclone_drive" nao esta disponivel.',
    );
  });
});
