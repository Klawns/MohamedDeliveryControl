import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminSettingsService } from './admin-settings.service';
import { AdminSettingsController } from './admin-settings.controller';
import { PaymentsModule } from '../payments/payments.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CacheModule } from '../cache/cache.module';
import { DrizzleAdminRepository } from './repositories/drizzle-admin.repository';
import { IAdminRepository } from './interfaces/admin-repository.interface';
import { DrizzleAdminSettingsRepository } from './repositories/drizzle-admin-settings.repository';
import { IAdminSettingsRepository } from './interfaces/admin-settings-repository.interface';
import { AdminBootstrapService } from './admin-bootstrap.service';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [PaymentsModule, SubscriptionsModule, CacheModule, UsersModule],
  providers: [
    AdminService,
    AdminSettingsService,
    AdminBootstrapService,
    {
      provide: IAdminRepository,
      useClass: DrizzleAdminRepository,
    },
    {
      provide: IAdminSettingsRepository,
      useClass: DrizzleAdminSettingsRepository,
    },
  ],
  controllers: [AdminController, AdminSettingsController],
  exports: [
    AdminService,
    AdminSettingsService,
    IAdminRepository,
    IAdminSettingsRepository,
  ],
})
export class AdminModule {}
