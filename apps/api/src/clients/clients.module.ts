import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { DrizzleClientsRepository } from './repositories/drizzle-clients.repository';
import { IClientsRepository } from './interfaces/clients-repository.interface';
import { DrizzleClientPaymentsRepository } from './repositories/drizzle-client-payments.repository';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { RidesModule } from '../rides/rides.module';

@Module({
  providers: [
    ClientsService,
    {
      provide: IClientsRepository,
      useClass: DrizzleClientsRepository,
    },
    {
      provide: IClientPaymentsRepository,
      useClass: DrizzleClientPaymentsRepository,
    },
  ],
  imports: [RidesModule],
  controllers: [ClientsController],
  exports: [ClientsService, IClientsRepository, IClientPaymentsRepository],
})
export class ClientsModule {}
