import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { IClientsRepository } from './interfaces/clients-repository.interface';
import { IRidesRepository } from '../rides/interfaces/rides-repository.interface';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';

describe('ClientsService', () => {
  let service: ClientsService;
  let clientsRepoMock: any;
  let ridesRepoMock: any;
  let paymentsRepoMock: any;

  beforeEach(async () => {
    clientsRepoMock = {
      findAll: jest.fn().mockResolvedValue({ clients: [], total: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'uuid-123', name: 'Client Test' }),
      findOne: jest.fn().mockResolvedValue({ id: 'uuid-123', name: 'Client Test' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    ridesRepoMock = {
      getPendingDebtStats: jest.fn().mockResolvedValue({ totalDebt: 100, pendingRidesCount: 2 }),
      markAllAsPaidForClient: jest.fn().mockResolvedValue(undefined),
    };

    paymentsRepoMock = {
      getUnusedPaymentsStats: jest.fn().mockResolvedValue({ totalPaid: 50, unusedPaymentsCount: 1 }),
      markAsUsed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: IClientsRepository, useValue: clientsRepoMock },
        { provide: IRidesRepository, useValue: ridesRepoMock },
        { provide: IClientPaymentsRepository, useValue: paymentsRepoMock },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a client', async () => {
    const result = await service.create('user-1', { name: 'Client Test' });
    expect(result).toEqual({ id: 'uuid-123', name: 'Client Test' });
    expect(clientsRepoMock.create).toHaveBeenCalled();
  });

  it('should get client balance using aggregated sql methods', async () => {
    const balance = await service.getClientBalance('user-1', 'uuid-123');
    expect(ridesRepoMock.getPendingDebtStats).toHaveBeenCalledWith('uuid-123', 'user-1');
    expect(paymentsRepoMock.getUnusedPaymentsStats).toHaveBeenCalledWith('uuid-123', 'user-1');
    expect(balance).toEqual({
      totalDebt: 100,
      totalPaid: 50,
      remainingBalance: 50, // Math.max(0, 100 - 50)
      pendingRides: 2,
      unusedPayments: 1,
    });
  });

  it('should close debt by marking rides as paid and payments as used', async () => {
    ridesRepoMock.markAllAsPaidForClient.mockResolvedValueOnce(2);
    const result = await service.closeDebt('user-1', 'uuid-123');
    expect(ridesRepoMock.markAllAsPaidForClient).toHaveBeenCalledWith('uuid-123', 'user-1');
    expect(paymentsRepoMock.markAsUsed).toHaveBeenCalledWith('uuid-123', 'user-1');
    expect(result).toEqual({ success: true, settledRides: 2 });
  });
});
