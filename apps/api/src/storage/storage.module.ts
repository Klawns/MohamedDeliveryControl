import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { R2StorageProvider } from './providers/r2/r2-storage.provider';

@Module({})
export class StorageModule {
  static register(): DynamicModule {
    return {
      module: StorageModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: STORAGE_PROVIDER,
          useFactory: (configService: ConfigService) => {
            const storageType = configService.get<string>('STORAGE_TYPE', 'R2');

            if (storageType === 'R2') {
              return new R2StorageProvider(configService);
            }

            throw new Error(`Storage type ${storageType} not supported`);
          },
          inject: [ConfigService],
        },
      ],
      exports: [STORAGE_PROVIDER],
    };
  }
}
