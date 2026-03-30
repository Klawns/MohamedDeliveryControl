/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Jest mocks in this spec intentionally use partial runtime stubs. */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RideAccountingService } from './ride-accounting.service';
import { IClientsRepository } from '../../clients/interfaces/clients-repository.interface';
import { IBalanceTransactionsRepository } from '../../clients/interfaces/balance-transactions-repository.interface';

describe('RideAccountingService', () => {
  let service: RideAccountingService;
  let clientsRepoMock: any;
  let balanceTransactionsRepoMock: any;

  beforeEach(async () => {
    clientsRepoMock = {
      findOne: jest.fn().mockResolvedValue({ id: 'client-1', balance: 0 }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    balanceTransactionsRepoMock = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RideAccountingService,
        {
          provide: IClientsRepository,
          useValue: clientsRepoMock,
        },
        {
          provide: IBalanceTransactionsRepository,
          useValue: balanceTransactionsRepoMock,
        },
      ],
    }).compile();

    service = module.get<RideAccountingService>(RideAccountingService);
  });

  it('should normalize payment snapshot using remaining debt', () => {
    expect(
      service.resolvePaymentSnapshot({
        value: 25,
        paidWithBalance: 10,
        paymentStatus: 'PENDING',
      }),
    ).toEqual({
      rideTotal: 25,
      paidWithBalance: 10,
      paymentStatus: 'PENDING',
      debtValue: 15,
    });
  });

  it('should mark ride as paid when balance covers the full value', () => {
    expect(
      service.resolvePaymentSnapshot({
        value: 25,
        paidWithBalance: 30,
        paymentStatus: 'PENDING',
      }),
    ).toEqual({
      rideTotal: 25,
      paidWithBalance: 25,
      paymentStatus: 'PAID',
      debtValue: 0,
    });
  });

  it('should consume client balance and register a debit transaction', async () => {
    clientsRepoMock.findOne.mockResolvedValueOnce({
      id: 'client-1',
      balance: 10,
    });

    const amountUsed = await service.consumeClientBalance(
      'user-1',
      'client-1',
      25,
      'tx',
    );

    expect(amountUsed).toBe(10);
    expect(clientsRepoMock.update).toHaveBeenCalledWith(
      'user-1',
      'client-1',
      { balance: 0 },
      'tx',
    );
    expect(balanceTransactionsRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        userId: 'user-1',
        amount: 10,
        type: 'DEBIT',
        origin: 'RIDE_USAGE',
      }),
      'tx',
    );
  });

  it('should refund client balance and register a credit transaction', async () => {
    clientsRepoMock.findOne.mockResolvedValueOnce({
      id: 'client-1',
      balance: 3,
    });

    await service.refundClientBalance('user-1', 'client-1', 7, 'ride-123', 'tx');

    expect(clientsRepoMock.update).toHaveBeenCalledWith(
      'user-1',
      'client-1',
      { balance: 10 },
      'tx',
    );
    expect(balanceTransactionsRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        userId: 'user-1',
        amount: 7,
        type: 'CREDIT',
        origin: 'MANUAL_ADJUSTMENT',
      }),
      'tx',
    );
  });

  it('should throw when client is missing', async () => {
    clientsRepoMock.findOne.mockResolvedValueOnce(undefined);

    await expect(
      service.getClientOrThrow('user-1', 'missing', 'tx'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
