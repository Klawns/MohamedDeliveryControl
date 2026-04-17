import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BACKUP_STORAGE_PROVIDERS,
  type BackupStorageProvider,
} from '../interfaces/backup-storage-provider.interface';

@Injectable()
export class BackupStorageRegistryService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(BACKUP_STORAGE_PROVIDERS)
    private readonly providers: BackupStorageProvider[],
  ) {}

  getActiveProvider() {
    const providerId =
      this.configService.get<string>('SYSTEM_BACKUP_PROVIDER') ?? 'r2';

    return this.getProvider(providerId);
  }

  getProvider(providerId: string) {
    const provider = this.providers.find((entry) => entry.id === providerId);

    if (!provider) {
      throw new Error(
        `Provider de backup sistêmico "${providerId}" nao esta disponivel.`,
      );
    }

    return provider;
  }
}
