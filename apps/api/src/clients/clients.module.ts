import { Module, forwardRef } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { DrizzleClientsRepository } from './repositories/drizzle-clients.repository';
import { IClientsRepository } from './interfaces/clients-repository.interface';
import { DrizzleClientPaymentsRepository } from './repositories/drizzle-client-payments.repository';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { DrizzleBalanceTransactionsRepository } from './repositories/drizzle-balance-transactions.repository';
import { IBalanceTransactionsRepository } from './interfaces/balance-transactions-repository.interface';
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
    {
      provide: IBalanceTransactionsRepository,
      useClass: DrizzleBalanceTransactionsRepository,
    },
  ],
  imports: [forwardRef(() => RidesModule)],
  controllers: [ClientsController],
  exports: [ClientsService, IClientsRepository, IClientPaymentsRepository, IBalanceTransactionsRepository],
})
export class ClientsModule {}
