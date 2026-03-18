import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { DrizzleSettingsRepository } from './repositories/drizzle-settings.repository';
import { ISettingsRepository } from './interfaces/settings-repository.interface';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [
    SettingsService,
    {
      provide: ISettingsRepository,
      useClass: DrizzleSettingsRepository,
    },
  ],
  controllers: [SettingsController],
  exports: [SettingsService, ISettingsRepository],
})
export class SettingsModule {}
