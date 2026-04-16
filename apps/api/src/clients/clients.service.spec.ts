/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await -- Jest mocks in this spec intentionally use partial runtime stubs. */
import { Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { IClientsRepository } from './interfaces/clients-repository.interface';
import { IRidesRepository } from '../rides/interfaces/rides-repository.interface';
import { IClientPaymentsRepository } from './interfaces/client-payments-repository.interface';
import { IBalanceTransactionsRepository } from './interfaces/balance-transactions-repository.interface';
import { DRIZZLE } from '../database/database.provider';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import type { ICacheProvider } from '../cache/interfaces/cache-provider.interface';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';

describe('ClientsService', () => {
  let service: ClientsService;
  let clientsRepoMock: any;
  let ridesRepoMock: any;
  let paymentsRepoMock: any;
  let balanceTransactionsRepoMock: any;
  let drizzleMock: any;
  let dashboardCacheMock: any;
  let cacheMock: jest.Mocked<ICacheProvider>;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    clientsRepoMock = {
      findAll: jest.fn().mockResolvedValue({ clients: [], total: 0 }),
      findDirectory: jest.fn().mockResolvedValue({
        clients: [{ id: 'client-1', name: 'Alice', isPinned: true }],
        returned: 1,
        limit: 20,
        hasMore: false,
        search: 'Ali',
      }),
      create: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      findOneForUpdate: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      update: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      incrementBalance: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      decrementBalance: jest
        .fn()
        .mockResolvedValue({ id: 'uuid-123', name: 'Client Test', balance: 0 }),
      findManyByIds: jest
        .fn()
        .mockResolvedValue([{ id: 'uuid-123', name: 'Client Test', balance: 0 }]),
      deleteManyByIds: jest
        .fn()
        .mockResolvedValue([{ id: 'uuid-123', name: 'Client Test', balance: 0 }]),
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
    cacheMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      getDel: jest.fn().mockResolvedValue(null),
      invalidatePrefix: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: CACHE_PROVIDER,
          useValue: cacheMock,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
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

  it('should return client directory entries with the provided search', async () => {
    const result = await service.findDirectory('user-1', 'Ali', 20);

    expect(clientsRepoMock.findDirectory).toHaveBeenCalledWith(
      'user-1',
      'Ali',
      20,
    );
    expect(result).toEqual({
      clients: [{ id: 'client-1', name: 'Alice', isPinned: true }],
      returned: 1,
      limit: 20,
      hasMore: false,
      search: 'Ali',
    });
    expect(cacheMock.set).toHaveBeenCalledTimes(1);
  });

  it('should return cached client directory entries without reading the repository', async () => {
    const cachedDirectory = {
      clients: [{ id: 'client-9', name: 'Cached Alice', isPinned: false }],
      returned: 1,
      limit: 10,
      hasMore: false,
      search: 'ali',
    };
    cacheMock.get.mockResolvedValueOnce(cachedDirectory);

    const result = await service.findDirectory('user-1', ' ali ', 10);

    expect(result).toEqual(cachedDirectory);
    expect(clientsRepoMock.findDirectory).not.toHaveBeenCalled();
  });

  it('should invalidate cached client directory entries after creating a client', async () => {
    await service.create('user-1', {
      name: 'Client Test',
      phone: '11999999999',
      address: 'Rua A',
    });

    expect(cacheMock.invalidatePrefix).toHaveBeenCalledWith(
      'client-directory:user-1:',
    );
  });

  it('should invalidate cached client directory entries after updating a client', async () => {
    await service.update('user-1', 'uuid-123', { name: 'Updated Client' });

    expect(cacheMock.invalidatePrefix).toHaveBeenCalledWith(
      'client-directory:user-1:',
    );
  });

  it('should invalidate cached client directory entries after deleting all clients', async () => {
    await service.deleteAll('user-1');

    expect(cacheMock.invalidatePrefix).toHaveBeenCalledWith(
      'client-directory:user-1:',
    );
  });

  it('should bulk delete clients and invalidate shared caches once', async () => {
    const result = await service.bulkDelete('user-1', {
      ids: ['uuid-123', 'uuid-456'],
    });

    expect(drizzleMock.db.transaction).toHaveBeenCalled();
    expect(clientsRepoMock.findManyByIds).toHaveBeenCalledWith(
      'user-1',
      ['uuid-123', 'uuid-456'],
      'tx',
    );
    expect(clientsRepoMock.deleteManyByIds).toHaveBeenCalledWith(
      'user-1',
      ['uuid-123'],
      'tx',
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(cacheMock.invalidatePrefix).toHaveBeenCalledWith(
      'client-directory:user-1:',
    );
    expect(result).toEqual({
      requestedCount: 2,
      deletedCount: 1,
    });
  });

  it('should throw when bulk delete does not find any client', async () => {
    clientsRepoMock.findManyByIds.mockResolvedValueOnce([]);

    await expect(
      service.bulkDelete('user-1', { ids: ['missing-client'] }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(clientsRepoMock.deleteManyByIds).not.toHaveBeenCalled();
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

  it('should not reject debt closing when partial payments do not cover the debt', async () => {
    paymentsRepoMock.getUnusedPaymentsStats.mockResolvedValueOnce({
      totalPaid: 50,
      unusedPaymentsCount: 1,
    });
    clientsRepoMock.findOneForUpdate.mockResolvedValueOnce({
      id: 'uuid-123',
      name: 'Client Test',
      balance: 10,
    });

    const result = await service.closeDebt('user-1', 'uuid-123');

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
    expect(result).toEqual({
      success: true,
      settledRides: 2,
      generatedBalance: 0,
    });
  });

  it('should close debt atomically when total paid covers the debt', async () => {
    paymentsRepoMock.getUnusedPaymentsStats.mockResolvedValueOnce({
      totalPaid: 120,
      unusedPaymentsCount: 1,
    });
    clientsRepoMock.findOneForUpdate.mockResolvedValueOnce({
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
    expect(clientsRepoMock.findOneForUpdate).toHaveBeenCalledWith(
      'user-1',
      'uuid-123',
      'tx',
    );
    expect(clientsRepoMock.incrementBalance).toHaveBeenCalledWith(
      'user-1',
      'uuid-123',
      20,
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

  it('should keep successful client creation even when cache invalidation fails after persistence', async () => {
    cacheMock.invalidatePrefix.mockRejectedValueOnce(
      new Error('directory cache invalidation failed'),
    );

    await expect(
      service.create('user-1', {
        name: 'Client Test',
        phone: '11999999999',
        address: 'Rua A',
      }),
    ).resolves.toEqual({
      id: 'uuid-123',
      name: 'Client Test',
      balance: 0,
    });

    expect(clientsRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        name: 'Client Test',
      }),
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Falha ao invalidar cache client directory'),
      expect.any(String),
    );
  });

  it('should keep successful partial payments even when dashboard cache invalidation fails', async () => {
    dashboardCacheMock.invalidate.mockRejectedValueOnce(
      new Error('dashboard cache invalidation failed'),
    );

    await expect(
      service.addPartialPayment('user-1', 'uuid-123', 30, 'Pagamento avulso'),
    ).resolves.toEqual({ id: 'payment-1' });

    expect(paymentsRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'uuid-123',
        userId: 'user-1',
        amount: 30,
      }),
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Falha ao invalidar cache user dashboard'),
      expect.any(String),
    );
  });
});
