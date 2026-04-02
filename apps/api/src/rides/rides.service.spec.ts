/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await -- Jest mocks in this spec intentionally use partial runtime stubs. */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { IRidesRepository } from './interfaces/rides-repository.interface';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';
import { DRIZZLE } from '../database/database.provider';
import { UserDashboardCacheService } from '../cache/user-dashboard-cache.service';
import { RideAccountingService } from './services/ride-accounting.service';
import { RideStatusService } from './services/ride-status.service';

describe('RidesService', () => {
  let service: RidesService;
  let repoMock: any;
  let subsMock: any;
  let cacheMock: any;
  let drizzleMock: any;
  let dashboardCacheMock: any;
  let rideAccountingMock: any;
  let rideStatusMock: any;

  beforeEach(async () => {
    repoMock = {
      findAll: jest.fn().mockResolvedValue({ rides: [], total: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'ride-123', value: 25.5 }),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: 'ride-123', value: 25.5 }),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: 'ride-123', value: 25.5 }),
      delete: jest.fn().mockResolvedValue({ id: 'ride-123' }),
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

    cacheMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    dashboardCacheMock = {
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

    drizzleMock = {
      schema: {
        rides: {
          id: 'rides.id',
          clientId: 'rides.clientId',
          paidWithBalance: 'rides.paidWithBalance',
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
          provide: CACHE_PROVIDER,
          useValue: cacheMock,
        },
        {
          provide: DRIZZLE,
          useValue: drizzleMock,
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
          provide: RideStatusService,
          useValue: rideStatusMock,
        },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
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

    expect(result).toEqual({ id: 'ride-123', value: 25.5 });
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
    expect(subsMock.findByUserId).toHaveBeenCalledWith('user-1');
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(cacheMock.del).toHaveBeenCalledWith('profile:user-1');
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

  it('should zero debt when marking a ride as paid via status update', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'ride-123',
      value: 30,
      paidWithBalance: 5,
      paymentStatus: 'PENDING',
      status: 'COMPLETED',
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
    expect(cacheMock.del).toHaveBeenCalledWith('profile:user-1');
  });

  it('should zero debt when cancelling a ride', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'ride-123',
      value: 30,
      paidWithBalance: 5,
      paymentStatus: 'PENDING',
      status: 'COMPLETED',
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
    repoMock.findOne.mockResolvedValueOnce({
      id: 'ride-123',
      value: 30,
      paidWithBalance: 5,
      paymentStatus: 'PENDING',
      status: 'CANCELLED',
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
                { id: 'ride-1', clientId: 'client-1', paidWithBalance: 5 },
                { id: 'ride-2', clientId: 'client-1', paidWithBalance: 2 },
                { id: 'ride-3', clientId: 'client-2', paidWithBalance: 0 },
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
    expect(dashboardCacheMock.invalidate).toHaveBeenCalledWith('user-1');
    expect(cacheMock.del).toHaveBeenCalledWith('profile:user-1');
    expect(result).toEqual({ success: true });
  });
});
