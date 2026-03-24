import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { IRidesRepository } from './interfaces/rides-repository.interface';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CACHE_PROVIDER } from '../cache/interfaces/cache-provider.interface';

describe('RidesService', () => {
  let service: RidesService;
  let repoMock: any;
  let subsMock: any;
  let cacheMock: any;

  beforeEach(async () => {
    repoMock = {
      findAll: jest.fn().mockResolvedValue({ rides: [], total: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'ride-123', value: 25.5 }),
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
      updateDetails: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({ default: 0 }),
      countRidesThisMonth: jest.fn().mockResolvedValue(0),
    };

    subsMock = {
      checkLimit: jest.fn().mockResolvedValue(undefined),
      incrementRideCount: jest.fn().mockResolvedValue(undefined),
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
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a ride for premium user', async () => {
    const result = await service.create('user-1', {
      clientId: 'client-1',
      value: 25.5,
      location: 'Central Park',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
    });
    expect(result).toEqual({ id: 'ride-123', value: 25.5 });
    expect(repoMock.create).toHaveBeenCalled();
  });

  it('should block creation if starter plan and limit reached', async () => {
    subsMock.findByUserId.mockResolvedValueOnce({
      plan: 'starter',
      status: 'active',
      rideCount: 20,
    });

    await expect(
      service.create('user-2', {
        clientId: 'client-2',
        value: 10,
        location: 'Downtown',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      }),
    ).rejects.toThrow(
      'Limite de 20 corridas do plano gratuito atingido. Faça o upgrade para continuar.',
    );
  });

  it('should allow creation if starter plan and limit not reached', async () => {
    subsMock.findByUserId.mockResolvedValueOnce({
      plan: 'starter',
      status: 'active',
      rideCount: 19,
    });

    const result = await service.create('user-3', {
      clientId: 'client-3',
      value: 15,
      location: 'Uptown',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
    });
    expect(result).toEqual({ id: 'ride-123', value: 25.5 });
    expect(repoMock.create).toHaveBeenCalled();
  });
});
