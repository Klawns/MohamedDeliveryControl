/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Jest mocks in this spec intentionally use partial runtime stubs. */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { IClientsRepository } from './interfaces/clients-repository.interface';
import { IRidesRepository } from '../rides/interfaces/rides-repository.interface';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { IBalanceTransactionsRepository } from './interfaces/balance-transactions-repository.interface';
import { DRIZZLE } from '../database/database.provider';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';

describe('ClientsService', () => {
  let service: ClientsService;
  let clientsRepoMock: any;
  let ridesRepoMock: any;
  let paymentsRepoMock: any;
  let balanceTransactionsRepoMock: any;
  let drizzleMock: any;
  let dashboardCacheMock: any;

  beforeEach(async () => {
    clientsRepoMock = {
      findAll: jest.fn().mockResolvedValue({ clients: [], total: 0 }),
      create: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      update: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteAll: jest.fn().mockResolvedValue(undefined),
    };

    ridesRepoMock = {
      getPendingDebtStats: jest
        .fn()
        .mockResolvedValue({ totalDebt: 100, pendingRidesCount: 2 }),
      markAllAsPaidForClient: jest.fn().mockResolvedValue(2),
    };

    paymentsRepoMock = {
      create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      findByClient: jest.fn().mockResolvedValue([]),
      getUnusedPaymentsStats: jest
        .fn()
        .mockResolvedValue({ totalPaid: 50, unusedPaymentsCount: 1 }),
      markAsUsed: jest.fn().mockResolvedValue(undefined),
    };

    balanceTransactionsRepoMock = {
      create: jest.fn().mockResolvedValue(undefined),
      findByClient: jest.fn().mockResolvedValue([]),
    };

    dashboardCacheMock = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    drizzleMock = {
      db: {
        transaction: jest.fn(async (callback: (tx: string) => unknown) =>
          callback('tx'),
        ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: IClientsRepository, useValue: clientsRepoMock },
        { provide: IRidesRepository, useValue: ridesRepoMock },
        { provide: IClientPaymentsRepository, useValue: paymentsRepoMock },
        {
          provide: IBalanceTransactionsRepository,
          useValue: balanceTransactionsRepoMock,
        },
        { provide: DRIZZLE, useValue: drizzleMock },
        {
          provide: UserDashboardCacheService,
          useValue: dashboardCacheMock,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a client preserving optional contact fields', async () => {
    const result = await service.create('user-1', {
      name: 'Client Test',
      phone: '11999999999',
      address: 'Rua A',
    });

    expect(result).toEqual({ id: 'uuid-123', name: 'Client Test', balance: 0 });
    expect(clientsRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        name: 'Client Test',
        phone: '11999999999',
        address: 'Rua A',
      }),
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
  });

  it('should get client balance using aggregated sql methods', async () => {
    const balance = await service.getClientBalance('user-1', 'uuid-123');

    expect(ridesRepoMock.getPendingDebtStats).toHaveBeenCalledWith(
      'uuid-123',
      'user-1',
    );
    expect(paymentsRepoMock.getUnusedPaymentsStats).toHaveBeenCalledWith(
      'uuid-123',
      'user-1',
    );
    expect(balance).toEqual({
      totalDebt: 100,
      totalPaid: 50,
      remainingBalance: 50,
      clientBalance: 0,
      pendingRides: 2,
      unusedPayments: 1,
    });
  });

  it('should reject debt closing when partial payments do not cover the debt', async () => {
    await expect(service.closeDebt('user-1', 'uuid-123')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(ridesRepoMock.markAllAsPaidForClient).not.toHaveBeenCalled();
    expect(paymentsRepoMock.markAsUsed).not.toHaveBeenCalled();
  });

  it('should close debt atomically when total paid covers the debt', async () => {
    paymentsRepoMock.getUnusedPaymentsStats.mockResolvedValueOnce({
      totalPaid: 120,
      unusedPaymentsCount: 1,
    });
    clientsRepoMock.findOne.mockResolvedValueOnce({
      id: 'uuid-123',
      name: 'Client Test',
      balance: 10,
    });

    const result = await service.closeDebt('user-1', 'uuid-123');

    expect(drizzleMock.db.transaction).toHaveBeenCalled();
    expect(ridesRepoMock.markAllAsPaidForClient).toHaveBeenCalledWith(
      'uuid-123',
      'user-1',
      'tx',
    );
    expect(paymentsRepoMock.markAsUsed).toHaveBeenCalledWith(
      'uuid-123',
      'user-1',
      'tx',
    );
    expect(clientsRepoMock.update).toHaveBeenCalledWith(
      'user-1',
      'uuid-123',
      { balance: 30 },
      'tx',
    );
    expect(balanceTransactionsRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'uuid-123',
        userId: 'user-1',
        amount: 20,
        type: 'CREDIT',
        origin: 'PAYMENT_OVERFLOW',
      }),
      'tx',
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      success: true,
      settledRides: 2,
      generatedBalance: 20,
    });
  });

  it('should invalidate dashboard cache after partial payment without debt settlement', async () => {
    const result = await service.addPartialPayment(
      'user-1',
      'uuid-123',
      30,
      'Pagamento avulso',
    );

    expect(paymentsRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'uuid-123',
        userId: 'user-1',
        amount: 30,
        notes: 'Pagamento avulso',
      }),
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ id: 'payment-1' });
  });
});
