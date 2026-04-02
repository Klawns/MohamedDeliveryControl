/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await -- This spec uses partial infrastructure stubs to validate import flows. */
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { FunctionalBackupImportService } from './functional-backup-import.service';
import {
  BACKUP_MANIFEST_VERSION,
  FUNCTIONAL_BACKUP_KIND,
} from '../backups.constants';
import { createZipArchive } from '../utils/zip-builder.util';

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(() => 'eq-condition'),
}));

describe('FunctionalBackupImportService', () => {
  const schema = {
    clients: { name: 'clients', userId: 'clients.userId' },
    rides: { name: 'rides' },
    clientPayments: { name: 'clientPayments' },
    balanceTransactions: { name: 'balanceTransactions' },
    ridePresets: { name: 'ridePresets', userId: 'ridePresets.userId' },
  };

  const buildArchiveBuffer = (dataset: {
    clients: unknown[];
    rides: unknown[];
    clientPayments: unknown[];
    balanceTransactions: unknown[];
    ridePresets: unknown[];
  }) => {
    const payloadBuffers = [
      Buffer.from(JSON.stringify(dataset.clients)),
      Buffer.from(JSON.stringify(dataset.rides)),
      Buffer.from(JSON.stringify(dataset.clientPayments)),
      Buffer.from(JSON.stringify(dataset.balanceTransactions)),
      Buffer.from(JSON.stringify(dataset.ridePresets)),
    ];

    const manifest = {
      version: BACKUP_MANIFEST_VERSION,
      kind: FUNCTIONAL_BACKUP_KIND,
      createdAt: '2026-04-01T12:00:00.000Z',
      ownerUserId: 'source-user',
      ownerName: 'Origem',
      appVersion: '0.0.1',
      modules: [
        'clients',
        'rides',
        'client_payments',
        'balance_transactions',
        'ride_presets',
      ],
      counts: {
        clients: dataset.clients.length,
        rides: dataset.rides.length,
        client_payments: dataset.clientPayments.length,
        balance_transactions: dataset.balanceTransactions.length,
        ride_presets: dataset.ridePresets.length,
      },
      sha256: createHash('sha256')
        .update(Buffer.concat(payloadBuffers))
        .digest('hex'),
    };

    return createZipArchive([
      { name: 'manifest.json', content: JSON.stringify(manifest) },
      { name: 'clients.json', content: payloadBuffers[0] },
      { name: 'rides.json', content: payloadBuffers[1] },
      { name: 'client-payments.json', content: payloadBuffers[2] },
      { name: 'balance-transactions.json', content: payloadBuffers[3] },
      { name: 'ride-presets.json', content: payloadBuffers[4] },
    ]);
  };

  const createService = () => {
    const insertedValues = new Map<string, any[]>();
    const importJobState = {
      id: 'import-job-1',
      uploadedStorageKey: 'imports/user-1/import-job-1.zip',
      status: 'validated',
      phase: 'validated',
      previewJson: JSON.stringify({
        manifestVersion: BACKUP_MANIFEST_VERSION,
        ownerUserId: 'source-user',
        ownerName: 'Origem',
        createdAt: '2026-04-01T12:00:00.000Z',
        archiveChecksum:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        sizeBytes: 123,
        modules: [
          'clients',
          'rides',
          'client_payments',
          'balance_transactions',
          'ride_presets',
        ],
        counts: {
          clients: 1,
          rides: 1,
          client_payments: 1,
          balance_transactions: 1,
          ride_presets: 1,
        },
        warnings: [],
      }),
      errorMessage: null,
      createdAt: new Date('2026-04-01T12:00:00.000Z'),
      startedAt: null,
      finishedAt: null,
    };
    const tx = {
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
      insert: jest.fn((table: { name: string }) => ({
        values: jest.fn(async (values: any[]) => {
          insertedValues.set(table.name, values);
        }),
      })),
    };

    const drizzleMock = {
      db: {
        transaction: jest.fn(
          async (callback: (trx: typeof tx) => Promise<void>) => callback(tx),
        ),
      },
      schema,
    };

    const repositoryMock = {
      createImportJob: jest.fn().mockResolvedValue({
        id: 'import-job-1',
        createdAt: new Date('2026-04-01T12:00:00.000Z'),
      }),
      createPreImportJob: jest.fn().mockResolvedValue({ id: 'pre-job-1' }),
      findImportJob: jest
        .fn()
        .mockImplementation(async () => ({ ...importJobState })),
      markImportRunning: jest
        .fn()
        .mockImplementation(async (_id: string, phase: string) => {
          importJobState.status = 'running';
          importJobState.phase = phase;
          importJobState.startedAt = new Date('2026-04-01T12:05:00.000Z');
        }),
      updateImportPhase: jest
        .fn()
        .mockImplementation(async (_id: string, phase: string) => {
          importJobState.phase = phase;
        }),
      markImportSuccess: jest
        .fn()
        .mockImplementation(async (_id: string, previewJson: string) => {
          importJobState.status = 'success';
          importJobState.phase = 'completed';
          importJobState.previewJson = previewJson;
          importJobState.finishedAt = new Date('2026-04-01T12:06:00.000Z');
        }),
      markImportFailed: jest
        .fn()
        .mockImplementation(async (_id: string, errorMessage: string) => {
          importJobState.status = 'failed';
          importJobState.phase = 'failed';
          importJobState.errorMessage = errorMessage;
          importJobState.finishedAt = new Date('2026-04-01T12:06:00.000Z');
        }),
      markRunning: jest.fn().mockResolvedValue(undefined),
      markSuccess: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };

    const storageProviderMock = {
      uploadPrivate: jest.fn().mockResolvedValue(undefined),
      download: jest.fn(),
    };

    const archiveServiceMock = {
      buildArchive: jest.fn().mockResolvedValue({
        archiveBuffer: Buffer.from('pre-import-zip'),
        archiveChecksum:
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        sizeBytes: 14,
        manifest: {
          counts: {
            clients: 0,
            rides: 0,
            client_payments: 0,
            balance_transactions: 0,
            ride_presets: 0,
          },
          modules: [
            'clients',
            'rides',
            'client_payments',
            'balance_transactions',
            'ride_presets',
          ],
          createdAt: '2026-04-01T12:00:00.000Z',
          ownerUserId: 'user-1',
          sha256:
            'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      }),
    };

    const cacheServiceMock = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    const service = new FunctionalBackupImportService(
      drizzleMock as any,
      repositoryMock as any,
      {
        get: jest.fn((key: string, fallback?: unknown) =>
          key === 'BACKUP_STORAGE_PREFIX' ? 'backups' : fallback,
        ),
      } as ConfigService,
      archiveServiceMock as any,
      cacheServiceMock as any,
      storageProviderMock as any,
    );

    return {
      service,
      repositoryMock,
      storageProviderMock,
      archiveServiceMock,
      cacheServiceMock,
      insertedValues,
    };
  };

  it('should reject invalid enum values during preview before execution', async () => {
    const { service, repositoryMock } = createService();
    const archiveBuffer = buildArchiveBuffer({
      clients: [
        {
          id: 'client-1',
          name: 'Cliente',
          createdAt: '2026-03-29T16:38:44.000Z',
        },
      ],
      rides: [
        {
          id: 'ride-1',
          clientId: 'client-1',
          value: '10',
          status: 'BROKEN',
          paymentStatus: 'PAID',
          createdAt: '2026-03-29T16:40:00.000Z',
        },
      ],
      clientPayments: [],
      balanceTransactions: [],
      ridePresets: [],
    });

    await expect(
      service.previewImport('user-1', {
        buffer: archiveBuffer,
        originalname: 'backup.zip',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repositoryMock.createImportJob).not.toHaveBeenCalled();
  });

  it('should reject invalid zip files as bad requests', async () => {
    const { service, repositoryMock } = createService();

    await expect(
      service.previewImport('user-1', {
        buffer: Buffer.from('not-a-zip'),
        originalname: 'backup.zip',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repositoryMock.createImportJob).not.toHaveBeenCalled();
  });

  it('should sanitize system managed fields and recompute balances during execution', async () => {
    const {
      service,
      repositoryMock,
      storageProviderMock,
      archiveServiceMock,
      cacheServiceMock,
      insertedValues,
    } = createService();
    const archiveBuffer = buildArchiveBuffer({
      clients: [
        {
          id: 'client-1',
          displayId: null,
          userId: 'source-user',
          name: 'caboco',
          phone: null,
          address: null,
          balance: '999.99',
          isPinned: false,
          createdAt: '2026-03-29T16:38:44.000Z',
        },
      ],
      rides: [
        {
          id: 'ride-1',
          displayId: 42,
          clientId: 'client-1',
          userId: 'source-user',
          value: '25.50',
          location: 'Centro',
          notes: 'ida',
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paidWithBalance: '0',
          debtValue: '0',
          rideDate: '2026-03-29T18:00:00.000Z',
          photo: 'photo-key',
          createdAt: '2026-03-29T18:00:00.000Z',
        },
      ],
      clientPayments: [
        {
          id: 'payment-1',
          clientId: 'client-1',
          userId: 'source-user',
          amount: '5.00',
          paymentDate: '2026-03-29T19:00:00.000Z',
          status: 'USED',
          notes: null,
          createdAt: '2026-03-29T19:00:00.000Z',
        },
      ],
      balanceTransactions: [
        {
          id: 'txn-1',
          clientId: 'client-1',
          userId: 'source-user',
          amount: '25.50',
          type: 'CREDIT',
          origin: 'MANUAL_ADJUSTMENT',
          description: 'ajuste',
          createdAt: '2026-03-29T18:05:00.000Z',
        },
      ],
      ridePresets: [
        {
          id: 'preset-1',
          userId: 'source-user',
          label: 'Centro',
          value: '15',
          location: 'Centro',
          createdAt: '2026-03-29T17:00:00.000Z',
        },
      ],
    });

    storageProviderMock.download.mockResolvedValue(archiveBuffer);

    const response = await service.executeImport('user-1', 'import-job-1');

    expect(response.status).toBe('success');
    expect(response.phase).toBe('completed');
    expect(repositoryMock.markImportRunning).toHaveBeenCalledWith(
      'import-job-1',
      'backing_up',
    );
    expect(repositoryMock.updateImportPhase).toHaveBeenCalledWith(
      'import-job-1',
      'importing',
    );
    expect(repositoryMock.createPreImportJob).toHaveBeenCalledWith(
      'user-1',
      'user-1',
    );
    expect(archiveServiceMock.buildArchive).toHaveBeenCalledWith('user-1');
    expect(storageProviderMock.uploadPrivate).toHaveBeenCalled();
    expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('user-1');

    expect(insertedValues.get('clients')).toEqual([
      expect.objectContaining({
        id: 'client-1',
        userId: 'user-1',
        name: 'caboco',
        balance: 25.5,
        isPinned: false,
      }),
    ]);
    expect(insertedValues.get('clients')?.[0]).not.toHaveProperty('displayId');

    expect(insertedValues.get('rides')).toEqual([
      expect.objectContaining({
        id: 'ride-1',
        clientId: 'client-1',
        userId: 'user-1',
        photo: null,
      }),
    ]);
    expect(insertedValues.get('rides')?.[0]).not.toHaveProperty('displayId');

    expect(insertedValues.get('clientPayments')).toEqual([
      expect.objectContaining({
        id: 'payment-1',
        clientId: 'client-1',
        userId: 'user-1',
      }),
    ]);
    expect(insertedValues.get('balanceTransactions')).toEqual([
      expect.objectContaining({
        id: 'txn-1',
        clientId: 'client-1',
        userId: 'user-1',
      }),
    ]);
    expect(insertedValues.get('ridePresets')).toEqual([
      expect.objectContaining({
        id: 'preset-1',
        userId: 'user-1',
      }),
    ]);
  });
});
