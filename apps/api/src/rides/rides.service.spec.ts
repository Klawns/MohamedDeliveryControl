/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await -- Jest mocks in this spec intentionally use partial runtime stubs. */
import { Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { ProfileCacheService } from '../cache/profile-cache.service';
import { IRidesRepository } from './interfaces/rides-repository.interface';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DRIZZLE } from '../database/database.provider';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';
import { RideAccountingService } from './services/ride-accounting.service';
import { RidePhotoReferenceService } from './services/ride-photo-reference.service';
import { RideStatusService } from './services/ride-status.service';

describe('RidesService', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  let service: RidesService;
  let repoMock: any;
  let subsMock: any;
  let drizzleMock: any;
  let dashboardCacheMock: any;
  let profileCacheMock: any;
  let rideAccountingMock: any;
  let ridePhotoReferenceMock: any;
  let rideStatusMock: any;
  let loggerErrorSpy: jest.SpyInstance;

  const sampleRide = {
    id: 'ride-456',
    displayId: 2,
    clientId: 'client-2',
    userId: 'user-1',
    value: 42,
    notes: 'Aeroporto',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paidWithBalance: 10,
    debtValue: 0,
    rideDate: new Date('2026-04-08T15:00:00.000Z'),
    createdAt: new Date('2026-04-08T15:05:00.000Z'),
    location: 'Terminal 1',
    photo: null,
    client: {
      id: 'client-2',
      name: 'Cliente C',
    },
  };

  beforeEach(async () => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    repoMock = {
      findAll: jest.fn().mockResolvedValue({ rides: [], total: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'ride-123', value: 25.5 }),
      findOneWithClient: jest.fn().mockResolvedValue({
        id: 'ride-123',
        displayId: 1,
        clientId: 'client-1',
        userId: 'user-1',
        value: 25.5,
        notes: null,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paidWithBalance: 0,
        debtValue: 0,
        rideDate: new Date('2026-04-08T12:28:00.000Z'),
        createdAt: new Date('2026-04-08T12:28:00.000Z'),
        location: 'Central Park',
        photo: null,
        client: {
          id: 'client-1',
          name: 'Cliente B',
        },
      }),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: 'ride-123', value: 25.5 }),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: 'ride-123', value: 25.5 }),
      delete: jest.fn().mockResolvedValue({ id: 'ride-123' }),
      findManyByIds: jest.fn().mockResolvedValue([]),
      deleteManyByIds: jest.fn().mockResolvedValue([]),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      getStats: jest
        .fn()
        .mockResolvedValue({ count: 0, totalValue: 0, rides: [] }),
      countAll: jest.fn().mockResolvedValue(0),
      findByClient: jest.fn().mockResolvedValue({ rides: [], total: 0 }),
      getFrequentClients: jest.fn().mockResolvedValue([]),
    };

    subsMock = {
      findByUserId: jest.fn().mockResolvedValue({
        plan: 'premium',
        status: 'active',
        validUntil: new Date(),
      }),
    };

    dashboardCacheMock = {
      getStats: jest.fn().mockResolvedValue(null),
      setStats: jest.fn().mockResolvedValue(undefined),
      getFrequentClients: jest.fn().mockResolvedValue(null),
      setFrequentClients: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    profileCacheMock = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    rideAccountingMock = {
      getClientOrThrow: jest
        .fn()
        .mockResolvedValue({ id: 'client-1', balance: 0 }),
      consumeClientBalance: jest.fn().mockResolvedValue(0),
      refundClientBalance: jest.fn().mockResolvedValue(undefined),
      resolvePaymentSnapshot: jest.fn(
        ({
          value,
          paidWithBalance,
          paymentStatus,
        }: {
          value: number;
          paidWithBalance: number;
          paymentStatus?: 'PENDING' | 'PAID';
        }) => ({
          rideTotal: Number(value),
          paidWithBalance: Number(paidWithBalance ?? 0),
          paymentStatus: paymentStatus === 'PENDING' ? 'PENDING' : 'PAID',
          debtValue:
            paymentStatus === 'PENDING'
              ? Number(value) - Number(paidWithBalance ?? 0)
              : 0,
        }),
      ),
    };

    ridePhotoReferenceMock = {
      validateForCreate: jest.fn(
        (_: string, photo: string | null | undefined) => photo,
      ),
      validateForUpdate: jest.fn(
        (_: string, photo: string | null | undefined) => photo,
      ),
      isManagedPhotoKey: jest.fn(
        (photo: string | null | undefined) =>
          typeof photo === 'string' && photo.startsWith('users/'),
      ),
      deleteManagedPhoto: jest.fn().mockResolvedValue(undefined),
    };

    drizzleMock = {
      schema: {
        rides: {
          id: 'rides.id',
          clientId: 'rides.clientId',
          paidWithBalance: 'rides.paidWithBalance',
          photo: 'rides.photo',
          userId: 'rides.userId',
        },
      },
      db: {
        transaction: jest.fn(async (callback: (tx: string) => unknown) =>
          callback('tx'),
        ),
      },
    };

    rideStatusMock = {
      prepareRideUpdate: jest.fn((existingRide: any, data: any) => ({
        nextClientId: data.clientId ?? existingRide.clientId,
        refundAmount: 0,
        updateData: data,
      })),
      prepareStatusUpdate: jest.fn(
        (
          _existingRide: any,
          data: { paymentStatus?: 'PENDING' | 'PAID'; status?: string },
        ) => ({
          ...data,
          debtValue:
            data.paymentStatus === 'PAID' || data.status === 'CANCELLED'
              ? 0
              : 25,
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        {
          provide: IRidesRepository,
          useValue: repoMock,
        },
        {
          provide: SubscriptionsService,
          useValue: subsMock,
        },
        {
          provide: DRIZZLE,
          useValue: drizzleMock,
        },
        {
          provide: ProfileCacheService,
          useValue: profileCacheMock,
        },
        {
          provide: UserDashboardCacheService,
          useValue: dashboardCacheMock,
        },
        {
          provide: RideAccountingService,
          useValue: rideAccountingMock,
        },
        {
          provide: RidePhotoReferenceService,
          useValue: ridePhotoReferenceMock,
        },
        {
          provide: RideStatusService,
          useValue: rideStatusMock,
        },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    loggerErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a ride for premium user without mutating legacy rideCount', async () => {
    const result = await service.create('user-1', {
      clientId: 'client-1',
      value: 25.5,
      location: 'Central Park',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      useBalance: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'ride-123',
        clientId: 'client-1',
        client: {
          id: 'client-1',
          name: 'Cliente B',
        },
      }),
    );
    expect(rideAccountingMock.getClientOrThrow).toHaveBeenCalledWith(
      'user-1',
      'client-1',
      'tx',
    );
    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: 'PAID',
        debtValue: 0,
        paidWithBalance: 0,
        value: 25.5,
      }),
      'tx',
    );
    expect(ridePhotoReferenceMock.validateForCreate).toHaveBeenCalledWith(
      'user-1',
      undefined,
    );
    expect(subsMock.findByUserId).toHaveBeenCalledWith('user-1');
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(profileCacheMock.invalidate).toHaveBeenCalledWith('user-1');
  });

  it('should allow creation if starter plan is active', async () => {
    subsMock.findByUserId.mockResolvedValueOnce({
      plan: 'starter',
      status: 'active',
      rideCount: 19,
    });

    await service.create('user-3', {
      clientId: 'client-3',
      value: 15,
      location: 'Uptown',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      useBalance: false,
    });

    expect(repoMock.create).toHaveBeenCalled();
  });

  it('should stop ride creation when the managed photo reference is rejected', async () => {
    ridePhotoReferenceMock.validateForCreate.mockRejectedValueOnce(
      new NotFoundException('asset not found'),
    );

    await expect(
      service.create('user-1', {
        clientId: 'client-1',
        value: 25.5,
        photo:
          'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
        useBalance: false,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(repoMock.create).not.toHaveBeenCalled();
  });

  it('should zero debt when marking a ride as paid via status update', async () => {
    repoMock.findOneWithClient.mockResolvedValueOnce({
      id: 'ride-123',
      displayId: 1,
      clientId: 'client-1',
      userId: 'user-1',
      value: 30,
      paidWithBalance: 5,
      paymentStatus: 'PENDING',
      status: 'COMPLETED',
      debtValue: 25,
      notes: null,
      rideDate: new Date('2026-04-08T12:28:00.000Z'),
      createdAt: new Date('2026-04-08T12:28:00.000Z'),
      location: null,
      photo: null,
      client: {
        id: 'client-1',
        name: 'Cliente B',
      },
    });

    await service.updateStatus('user-1', 'ride-123', {
      paymentStatus: 'PAID',
    });

    expect(repoMock.updateStatus).toHaveBeenCalledWith(
      'user-1',
      'ride-123',
      expect.objectContaining({
        paymentStatus: 'PAID',
        debtValue: 0,
      }),
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(profileCacheMock.invalidate).toHaveBeenCalledWith('user-1');
  });

  it('should zero debt when cancelling a ride', async () => {
    repoMock.findOneWithClient.mockResolvedValueOnce({
      id: 'ride-123',
      displayId: 1,
      clientId: 'client-1',
      userId: 'user-1',
      value: 30,
      paidWithBalance: 5,
      paymentStatus: 'PENDING',
      status: 'COMPLETED',
      debtValue: 25,
      notes: null,
      rideDate: new Date('2026-04-08T12:28:00.000Z'),
      createdAt: new Date('2026-04-08T12:28:00.000Z'),
      location: null,
      photo: null,
      client: {
        id: 'client-1',
        name: 'Cliente B',
      },
    });

    await service.updateStatus('user-1', 'ride-123', {
      status: 'CANCELLED',
    });

    expect(repoMock.updateStatus).toHaveBeenCalledWith(
      'user-1',
      'ride-123',
      expect.objectContaining({
        status: 'CANCELLED',
        debtValue: 0,
      }),
    );
  });

  it('should restore debt when moving a cancelled ride back to an active status', async () => {
    repoMock.findOneWithClient.mockResolvedValueOnce({
      id: 'ride-123',
      displayId: 1,
      clientId: 'client-1',
      userId: 'user-1',
      value: 30,
      paidWithBalance: 5,
      paymentStatus: 'PENDING',
      status: 'CANCELLED',
      debtValue: 25,
      notes: null,
      rideDate: new Date('2026-04-08T12:28:00.000Z'),
      createdAt: new Date('2026-04-08T12:28:00.000Z'),
      location: null,
      photo: null,
      client: {
        id: 'client-1',
        name: 'Cliente B',
      },
    });
    rideStatusMock.prepareStatusUpdate.mockReturnValueOnce({
      status: 'COMPLETED',
      debtValue: 25,
    });

    await service.updateStatus('user-1', 'ride-123', {
      status: 'COMPLETED',
    });

    expect(repoMock.updateStatus).toHaveBeenCalledWith(
      'user-1',
      'ride-123',
      expect.objectContaining({
        status: 'COMPLETED',
        debtValue: 25,
      }),
    );
  });

  it('should throw not found when updating status for a missing ride', async () => {
    repoMock.findOneWithClient.mockResolvedValueOnce(null);

    await expect(
      service.updateStatus('user-1', 'missing', {
        paymentStatus: 'PAID',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should refund grouped balance usage when deleting all rides', async () => {
    drizzleMock.db.transaction = jest.fn(
      async (callback: (tx: { select: jest.Mock }) => unknown) =>
        callback({
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                {
                  id: 'ride-1',
                  clientId: 'client-1',
                  paidWithBalance: 5,
                  photo:
                    'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
                },
                {
                  id: 'ride-2',
                  clientId: 'client-1',
                  paidWithBalance: 2,
                  photo: 'https://legacy.example.com/photo.jpg',
                },
                {
                  id: 'ride-3',
                  clientId: 'client-2',
                  paidWithBalance: 0,
                  photo: null,
                },
              ]),
            }),
          }),
        }),
    );

    const result = await service.deleteAll('user-1');

    expect(rideAccountingMock.refundClientBalance).toHaveBeenCalledWith(
      'user-1',
      'client-1',
      7,
      'bulk-delete',
      expect.anything(),
    );
    expect(repoMock.deleteAll).toHaveBeenCalledWith(
      'user-1',
      expect.anything(),
    );
    expect(ridePhotoReferenceMock.deleteManagedPhoto).toHaveBeenCalledWith(
      'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(profileCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ success: true });
  });

  it('should bulk delete only the rides found for the user and refund grouped balances', async () => {
    repoMock.findManyByIds.mockResolvedValueOnce([
      {
        id: 'ride-1',
        clientId: 'client-1',
        userId: 'user-1',
        paidWithBalance: 3,
        photo:
          'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      },
      {
        id: 'ride-2',
        clientId: 'client-1',
        userId: 'user-1',
        paidWithBalance: 2,
        photo: null,
      },
    ]);
    repoMock.deleteManyByIds.mockResolvedValueOnce([
      { id: 'ride-1' },
      { id: 'ride-2' },
    ]);

    const result = await service.bulkDelete('user-1', {
      ids: ['ride-1', 'ride-2', 'ride-missing'],
    });

    expect(repoMock.findManyByIds).toHaveBeenCalledWith(
      'user-1',
      ['ride-1', 'ride-2', 'ride-missing'],
      'tx',
    );
    expect(rideAccountingMock.refundClientBalance).toHaveBeenCalledWith(
      'user-1',
      'client-1',
      5,
      'bulk-delete',
      'tx',
    );
    expect(repoMock.deleteManyByIds).toHaveBeenCalledWith(
      'user-1',
      ['ride-1', 'ride-2'],
      'tx',
    );
    expect(ridePhotoReferenceMock.deleteManagedPhoto).toHaveBeenCalledWith(
      'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(profileCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      requestedCount: 3,
      deletedCount: 2,
    });
  });

  it('should throw not found when bulk delete has no valid rides', async () => {
    repoMock.findManyByIds.mockResolvedValueOnce([]);

    await expect(
      service.bulkDelete('user-1', {
        ids: ['missing-1', 'missing-2'],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repoMock.deleteManyByIds).not.toHaveBeenCalled();
  });

  it('should return cached frequent clients without reading from the repository', async () => {
    const cachedClients = [
      { id: 'client-1', name: 'Cliente B', isPinned: true },
    ];
    dashboardCacheMock.getFrequentClients.mockResolvedValueOnce(cachedClients);

    const result = await service.getFrequentClients('user-1');

    expect(result).toEqual(cachedClients);
    expect(repoMock.getFrequentClients).not.toHaveBeenCalled();
    expect(dashboardCacheMock.setFrequentClients).not.toHaveBeenCalled();
  });

  it('should populate frequent clients cache after a cache miss', async () => {
    const frequentClients = [
      { id: 'client-2', name: 'Cliente C', isPinned: true },
    ];
    repoMock.getFrequentClients.mockResolvedValueOnce(frequentClients);

    const result = await service.getFrequentClients('user-1');

    expect(result).toEqual(frequentClients);
    expect(dashboardCacheMock.getFrequentClients).toHaveBeenCalledWith(
      'user-1',
    );
    expect(repoMock.getFrequentClients).toHaveBeenCalledWith('user-1');
    expect(dashboardCacheMock.setFrequentClients).toHaveBeenCalledWith(
      'user-1',
      frequentClients,
    );
  });

  it('should return cached production stats without reading from the repository', async () => {
    process.env.NODE_ENV = 'production';
    const cachedStats = {
      count: 1,
      totalValue: 42,
      rides: [
        {
          id: 'ride-456',
          value: 42,
          location: 'Terminal 1',
          notes: 'Aeroporto',
          photo: null,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          rideDate: new Date('2026-04-08T15:00:00.000Z'),
          createdAt: new Date('2026-04-08T15:05:00.000Z'),
          paidWithBalance: 10,
          debtValue: 0,
          client: { id: 'client-2', name: 'Cliente C' },
        },
      ],
    };
    dashboardCacheMock.getStats.mockResolvedValueOnce(cachedStats);

    const result = await service.getStats('user-1', { period: 'month' });

    expect(result).toEqual(cachedStats);
    expect(dashboardCacheMock.getStats).toHaveBeenCalledWith('user-1', 'month');
    expect(repoMock.getStats).not.toHaveBeenCalled();
    expect(dashboardCacheMock.setStats).not.toHaveBeenCalled();
  });

  it('should populate production stats cache after a cache miss', async () => {
    process.env.NODE_ENV = 'production';
    repoMock.getStats.mockResolvedValueOnce({
      count: 1,
      totalValue: 42,
      rides: [sampleRide],
    });

    const result = await service.getStats('user-1', { period: 'month' });

    expect(dashboardCacheMock.getStats).toHaveBeenCalledWith('user-1', 'month');
    expect(repoMock.getStats).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date),
      undefined,
    );
    expect(result).toEqual({
      count: 1,
      totalValue: 42,
      rides: [
        expect.objectContaining({
          id: 'ride-456',
          value: 42,
          client: { id: 'client-2', name: 'Cliente C' },
        }),
      ],
    });
    expect(dashboardCacheMock.setStats).toHaveBeenCalledWith(
      'user-1',
      'month',
      result,
    );
  });

  it('should bypass stats cache for custom periods and client-scoped stats', async () => {
    process.env.NODE_ENV = 'production';
    repoMock.getStats.mockResolvedValue({
      count: 1,
      totalValue: 42,
      rides: [sampleRide],
    });

    await service.getStats('user-1', {
      period: 'custom',
      start: '2026-04-01',
      end: '2026-04-08',
    });
    await service.getStats('user-1', {
      period: 'month',
      clientId: 'client-2',
    });

    expect(dashboardCacheMock.getStats).not.toHaveBeenCalled();
    expect(dashboardCacheMock.setStats).not.toHaveBeenCalled();
    expect(repoMock.getStats).toHaveBeenCalledTimes(2);
    expect(repoMock.getStats).toHaveBeenLastCalledWith(
      'user-1',
      expect.any(Date),
      expect.any(Date),
      'client-2',
    );
  });

  it('should handle concurrent cache misses in production stats without stale cache errors', async () => {
    process.env.NODE_ENV = 'production';
    repoMock.getStats.mockResolvedValue({
      count: 1,
      totalValue: 42,
      rides: [sampleRide],
    });

    const [firstResult, secondResult] = await Promise.all([
      service.getStats('user-1', { period: 'week' }),
      service.getStats('user-1', { period: 'week' }),
    ]);

    expect(firstResult).toEqual(secondResult);
    expect(repoMock.getStats).toHaveBeenCalledTimes(2);
    expect(dashboardCacheMock.setStats).toHaveBeenCalledTimes(2);
    expect(dashboardCacheMock.setStats).toHaveBeenNthCalledWith(
      1,
      'user-1',
      'week',
      firstResult,
    );
    expect(dashboardCacheMock.setStats).toHaveBeenNthCalledWith(
      2,
      'user-1',
      'week',
      secondResult,
    );
  });

  it('should invalidate dashboard and profile caches after updating a ride', async () => {
    repoMock.findOneWithClient.mockResolvedValueOnce({
      ...sampleRide,
      photo: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    });
    repoMock.findOneWithClient.mockResolvedValueOnce({
      ...sampleRide,
      photo: null,
    });

    await service.update('user-1', 'ride-123', {
      value: 32,
      photo: null,
    });

    expect(ridePhotoReferenceMock.validateForUpdate).toHaveBeenCalledWith(
      'user-1',
      null,
      'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    );
    expect(ridePhotoReferenceMock.deleteManagedPhoto).toHaveBeenCalledWith(
      'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(profileCacheMock.invalidate).toHaveBeenCalledWith('user-1');
  });

  it('should stop ride update when a new managed photo reference is rejected', async () => {
    repoMock.findOneWithClient.mockResolvedValueOnce({
      ...sampleRide,
      photo: null,
    });
    ridePhotoReferenceMock.validateForUpdate.mockRejectedValueOnce(
      new NotFoundException('asset not found'),
    );

    await expect(
      service.update('user-1', 'ride-123', {
        photo:
          'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(repoMock.update).not.toHaveBeenCalled();
  });

  it('should invalidate dashboard and profile caches after deleting a ride', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      ...sampleRide,
      photo: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    });

    await expect(service.delete('user-1', 'ride-123')).resolves.toBeUndefined();

    expect(ridePhotoReferenceMock.deleteManagedPhoto).toHaveBeenCalledWith(
      'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(profileCacheMock.invalidate).toHaveBeenCalledWith('user-1');
  });

  it('should surface dashboard cache invalidation failures after updating a ride', async () => {
    dashboardCacheMock.invalidate.mockRejectedValueOnce(
      new Error('dashboard cache invalidation failed'),
    );

    await expect(
      service.update('user-1', 'ride-123', {
        value: 32,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'ride-123',
      }),
    );

    expect(repoMock.update).toHaveBeenCalledWith(
      'user-1',
      'ride-123',
      expect.objectContaining({
        value: 32,
      }),
      'tx',
    );
    expect(profileCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Falha ao invalidar cache user dashboard'),
      expect.any(String),
    );
  });

  it('should keep successful ride creation even when cache invalidation fails after persistence', async () => {
    profileCacheMock.invalidate.mockRejectedValueOnce(
      new Error('profile cache invalidation failed'),
    );

    await expect(
      service.create('user-1', {
        clientId: 'client-1',
        value: 25.5,
        location: 'Central Park',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        useBalance: false,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'ride-123',
      }),
    );

    expect(repoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        userId: 'user-1',
      }),
      'tx',
    );
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Falha ao invalidar cache profile'),
      expect.any(String),
    );
  });
});
