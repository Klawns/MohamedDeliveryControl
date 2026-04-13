import { Module, forwardRef } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CacheModule } from '../cache/cache.module';
import { DrizzleRidesRepository } from './repositories/drizzle-rides.repository';
import { IRidesRepository } from './interfaces/rides-repository.interface';
import { ClientsModule } from '../clients/clients.module';
import { RideAccountingService } from './services/ride-accounting.service';
import { RidePhotoReferenceService } from './services/ride-photo-reference.service';
import { RideStatusService } from './services/ride-status.service';
import { RideCursorService } from './repositories/ride-cursor.service';
import { RideReadRepository } from './repositories/ride-read.repository';
import { RideStatsRepository } from './repositories/ride-stats.repository';

@Module({
  imports: [SubscriptionsModule, CacheModule, forwardRef(() => ClientsModule)],
  providers: [
    RidesService,
    RideAccountingService,
    RidePhotoReferenceService,
    RideStatusService,
    RideCursorService,
    RideReadRepository,
    RideStatsRepository,
    {
      provide: IRidesRepository,
      useClass: DrizzleRidesRepository,
    },
  ],
  controllers: [RidesController],
  exports: [RidesService, IRidesRepository],
})
export class RidesModule {}
