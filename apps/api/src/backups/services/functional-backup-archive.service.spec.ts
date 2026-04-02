/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await -- This spec uses lightweight Drizzle stubs to validate archive assembly. */
import { FunctionalBackupArchiveService } from './functional-backup-archive.service';
import { readZipArchive } from '../utils/zip-reader.util';

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(() => 'eq-condition'),
  asc: jest.fn((value) => value),
}));

const schema = {
  users: {
    id: 'users.id',
    name: 'users.name',
  },
  clients: {
    userId: 'clients.userId',
    createdAt: 'clients.createdAt',
    id: 'clients.id',
  },
  rides: {
    userId: 'rides.userId',
    rideDate: 'rides.rideDate',
    createdAt: 'rides.createdAt',
    id: 'rides.id',
  },
  clientPayments: {
    userId: 'clientPayments.userId',
    paymentDate: 'clientPayments.paymentDate',
    createdAt: 'clientPayments.createdAt',
    id: 'clientPayments.id',
  },
  balanceTransactions: {
    userId: 'balanceTransactions.userId',
    createdAt: 'balanceTransactions.createdAt',
    id: 'balanceTransactions.id',
  },
  ridePresets: {
    userId: 'ridePresets.userId',
    createdAt: 'ridePresets.createdAt',
    id: 'ridePresets.id',
  },
};

describe('FunctionalBackupArchiveService', () => {
  it('should build a zip archive with manifest and dataset metadata', async () => {
    const service = new FunctionalBackupArchiveService({
      db: {
        select: () => ({
          from: (table: any) => {
            if (table === schema.users) {
              return {
                where: () => ({
                  limit: async () => [{ name: 'Alice Motorista' }],
                }),
              };
            }

            return {
              where: () => ({
                orderBy: async () => {
                  switch (table) {
                    case schema.clients:
                      return [
                        { id: 'client-1', userId: 'user-1', name: 'Alice' },
                      ];
                    case schema.rides:
                      return [
                        {
                          id: 'ride-1',
                          userId: 'user-1',
                          clientId: 'client-1',
                        },
                      ];
                    case schema.clientPayments:
                      return [
                        {
                          id: 'payment-1',
                          userId: 'user-1',
                          clientId: 'client-1',
                        },
                      ];
                    case schema.balanceTransactions:
                      return [
                        { id: 'txn-1', userId: 'user-1', clientId: 'client-1' },
                      ];
                    case schema.ridePresets:
                      return [
                        { id: 'preset-1', userId: 'user-1', label: 'Centro' },
                      ];
                    default:
                      return [];
                  }
                },
              }),
            };
          },
        }),
      },
      schema,
    } as any);

    const result = await service.buildArchive('user-1');

    expect(result.archiveBuffer.subarray(0, 2).toString()).toBe('PK');
    expect(result.archiveChecksum).toHaveLength(64);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.manifest.counts).toEqual({
      clients: 1,
      rides: 1,
      client_payments: 1,
      balance_transactions: 1,
      ride_presets: 1,
    });
    expect(result.manifest.ownerName).toBe('Alice Motorista');
    expect(result.archiveBuffer.includes(Buffer.from('manifest.json'))).toBe(
      true,
    );
    expect(result.archiveBuffer.includes(Buffer.from('clients.json'))).toBe(
      true,
    );
  });

  it('should exclude system managed fields from exported datasets', async () => {
    const service = new FunctionalBackupArchiveService({
      db: {
        select: () => ({
          from: (table: any) => {
            if (table === schema.users) {
              return {
                where: () => ({
                  limit: async () => [{ name: 'Alice Motorista' }],
                }),
              };
            }

            return {
              where: () => ({
                orderBy: async () => {
                  switch (table) {
                    case schema.clients:
                      return [
                        {
                          id: 'client-1',
                          displayId: 12,
                          userId: 'user-1',
                          name: 'Alice',
                          balance: '10.50',
                          isPinned: true,
                          createdAt: '2026-03-31T12:00:00.000Z',
                        },
                      ];
                    case schema.rides:
                      return [
                        {
                          id: 'ride-1',
                          displayId: 8,
                          userId: 'user-1',
                          clientId: 'client-1',
                          value: '22.00',
                          status: 'COMPLETED',
                          paymentStatus: 'PAID',
                          paidWithBalance: '0',
                          debtValue: '0',
                          photo: 'photo-key',
                          createdAt: '2026-03-31T12:00:00.000Z',
                        },
                      ];
                    case schema.clientPayments:
                      return [
                        {
                          id: 'payment-1',
                          userId: 'user-1',
                          clientId: 'client-1',
                          amount: '10.00',
                          status: 'USED',
                          createdAt: '2026-03-31T12:00:00.000Z',
                        },
                      ];
                    case schema.balanceTransactions:
                      return [
                        {
                          id: 'txn-1',
                          userId: 'user-1',
                          clientId: 'client-1',
                          amount: '10.00',
                          type: 'CREDIT',
                          origin: 'MANUAL_ADJUSTMENT',
                          createdAt: '2026-03-31T12:00:00.000Z',
                        },
                      ];
                    case schema.ridePresets:
                      return [
                        {
                          id: 'preset-1',
                          userId: 'user-1',
                          label: 'Centro',
                          value: '15.00',
                          location: 'Centro',
                          createdAt: '2026-03-31T12:00:00.000Z',
                        },
                      ];
                    default:
                      return [];
                  }
                },
              }),
            };
          },
        }),
      },
      schema,
    } as any);

    const result = await service.buildArchive('user-1');
    const entries = readZipArchive(result.archiveBuffer);
    const clients = JSON.parse(
      entries
        .find((entry) => entry.name === 'clients.json')!
        .content.toString('utf8'),
    ) as Array<Record<string, unknown>>;
    const rides = JSON.parse(
      entries
        .find((entry) => entry.name === 'rides.json')!
        .content.toString('utf8'),
    ) as Array<Record<string, unknown>>;

    expect(clients[0]).toEqual({
      id: 'client-1',
      name: 'Alice',
      phone: null,
      address: null,
      isPinned: true,
      createdAt: '2026-03-31T12:00:00.000Z',
    });
    expect(rides[0]).toEqual(
      expect.objectContaining({
        id: 'ride-1',
        clientId: 'client-1',
        value: '22.00',
        photo: null,
      }),
    );
    expect(rides[0]).not.toHaveProperty('displayId');
    expect(rides[0]).not.toHaveProperty('userId');
  });
});
