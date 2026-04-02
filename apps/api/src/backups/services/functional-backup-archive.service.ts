/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import {
  BACKUP_MANIFEST_VERSION,
  FUNCTIONAL_BACKUP_KIND,
} from '../backups.constants';
import { createZipArchive } from '../utils/zip-builder.util';

const API_VERSION = '0.0.1';

type BackupModuleName =
  | 'clients'
  | 'rides'
  | 'client_payments'
  | 'balance_transactions'
  | 'ride_presets';

export interface FunctionalBackupManifest {
  version: number;
  kind: typeof FUNCTIONAL_BACKUP_KIND;
  createdAt: string;
  ownerUserId: string;
  ownerName: string | null;
  appVersion: string;
  modules: BackupModuleName[];
  counts: Record<BackupModuleName, number>;
  sha256: string;
}

export interface FunctionalBackupArchiveResult {
  archiveBuffer: Buffer;
  archiveChecksum: string;
  sizeBytes: number;
  manifest: FunctionalBackupManifest;
}

interface ExportedClientRecord {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  isPinned: boolean;
  createdAt: Date | string | null;
}

interface ExportedRideRecord {
  id: string;
  clientId: string;
  value: number | string;
  location: string | null;
  notes: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID';
  paidWithBalance: number | string;
  debtValue: number | string;
  rideDate: Date | string | null;
  photo: null;
  createdAt: Date | string | null;
}

interface ExportedClientPaymentRecord {
  id: string;
  clientId: string;
  amount: number | string;
  paymentDate: Date | string | null;
  status: 'UNUSED' | 'USED';
  notes: string | null;
  createdAt: Date | string | null;
}

interface ExportedBalanceTransactionRecord {
  id: string;
  clientId: string;
  amount: number | string;
  type: 'CREDIT' | 'DEBIT';
  origin: 'PAYMENT_OVERFLOW' | 'RIDE_USAGE' | 'MANUAL_ADJUSTMENT';
  description: string | null;
  createdAt: Date | string | null;
}

interface ExportedRidePresetRecord {
  id: string;
  label: string;
  value: number | string;
  location: string;
  createdAt: Date | string | null;
}

@Injectable()
export class FunctionalBackupArchiveService {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
  ) {}

  private get db() {
    return this.drizzle.db;
  }

  private get schema() {
    return this.drizzle.schema;
  }

  private stringifyJson(value: unknown) {
    return JSON.stringify(value);
  }

  async buildArchive(userId: string): Promise<FunctionalBackupArchiveResult> {
    const [ownerUser] = await this.db
      .select({
        name: this.schema.users.name,
      })
      .from(this.schema.users)
      .where(eq(this.schema.users.id, userId))
      .limit(1);

    const [
      rawClients,
      rawRides,
      rawClientPayments,
      rawBalanceTransactions,
      rawRidePresets,
    ] = await Promise.all([
      this.db
        .select()
        .from(this.schema.clients)
        .where(eq(this.schema.clients.userId, userId))
        .orderBy(
          asc(this.schema.clients.createdAt),
          asc(this.schema.clients.id),
        ),
      this.db
        .select()
        .from(this.schema.rides)
        .where(eq(this.schema.rides.userId, userId))
        .orderBy(
          asc(this.schema.rides.rideDate),
          asc(this.schema.rides.createdAt),
          asc(this.schema.rides.id),
        ),
      this.db
        .select()
        .from(this.schema.clientPayments)
        .where(eq(this.schema.clientPayments.userId, userId))
        .orderBy(
          asc(this.schema.clientPayments.paymentDate),
          asc(this.schema.clientPayments.createdAt),
          asc(this.schema.clientPayments.id),
        ),
      this.db
        .select()
        .from(this.schema.balanceTransactions)
        .where(eq(this.schema.balanceTransactions.userId, userId))
        .orderBy(
          asc(this.schema.balanceTransactions.createdAt),
          asc(this.schema.balanceTransactions.id),
        ),
      this.db
        .select()
        .from(this.schema.ridePresets)
        .where(eq(this.schema.ridePresets.userId, userId))
        .orderBy(
          asc(this.schema.ridePresets.createdAt),
          asc(this.schema.ridePresets.id),
        ),
    ]);

    const clients: ExportedClientRecord[] = rawClients.map((client: any) => ({
      id: client.id,
      name: client.name,
      phone: client.phone ?? null,
      address: client.address ?? null,
      isPinned: Boolean(client.isPinned),
      createdAt: client.createdAt ?? null,
    }));
    const rides: ExportedRideRecord[] = rawRides.map((ride: any) => ({
      id: ride.id,
      clientId: ride.clientId,
      value: ride.value,
      location: ride.location ?? null,
      notes: ride.notes ?? null,
      status: ride.status,
      paymentStatus: ride.paymentStatus,
      paidWithBalance: ride.paidWithBalance ?? 0,
      debtValue: ride.debtValue ?? 0,
      rideDate: ride.rideDate ?? null,
      photo: null,
      createdAt: ride.createdAt ?? null,
    }));
    const clientPayments: ExportedClientPaymentRecord[] = rawClientPayments.map(
      (payment: any) => ({
        id: payment.id,
        clientId: payment.clientId,
        amount: payment.amount,
        paymentDate: payment.paymentDate ?? null,
        status: payment.status,
        notes: payment.notes ?? null,
        createdAt: payment.createdAt ?? null,
      }),
    );
    const balanceTransactions: ExportedBalanceTransactionRecord[] =
      rawBalanceTransactions.map((transaction: any) => ({
        id: transaction.id,
        clientId: transaction.clientId,
        amount: transaction.amount,
        type: transaction.type,
        origin: transaction.origin,
        description: transaction.description ?? null,
        createdAt: transaction.createdAt ?? null,
      }));
    const ridePresets: ExportedRidePresetRecord[] = rawRidePresets.map(
      (preset: any) => ({
        id: preset.id,
        label: preset.label,
        value: preset.value,
        location: preset.location,
        createdAt: preset.createdAt ?? null,
      }),
    );

    const modules: BackupModuleName[] = [
      'clients',
      'rides',
      'client_payments',
      'balance_transactions',
      'ride_presets',
    ];
    const counts = {
      clients: clients.length,
      rides: rides.length,
      client_payments: clientPayments.length,
      balance_transactions: balanceTransactions.length,
      ride_presets: ridePresets.length,
    };

    const payloadBuffers = [
      Buffer.from(this.stringifyJson(clients)),
      Buffer.from(this.stringifyJson(rides)),
      Buffer.from(this.stringifyJson(clientPayments)),
      Buffer.from(this.stringifyJson(balanceTransactions)),
      Buffer.from(this.stringifyJson(ridePresets)),
    ];

    const manifest: FunctionalBackupManifest = {
      version: BACKUP_MANIFEST_VERSION,
      kind: FUNCTIONAL_BACKUP_KIND,
      createdAt: new Date().toISOString(),
      ownerUserId: userId,
      ownerName: ownerUser?.name ?? null,
      appVersion: API_VERSION,
      modules,
      counts,
      sha256: createHash('sha256')
        .update(Buffer.concat(payloadBuffers))
        .digest('hex'),
    };

    const archiveBuffer = createZipArchive([
      { name: 'manifest.json', content: this.stringifyJson(manifest) },
      { name: 'clients.json', content: payloadBuffers[0] },
      { name: 'rides.json', content: payloadBuffers[1] },
      { name: 'client-payments.json', content: payloadBuffers[2] },
      { name: 'balance-transactions.json', content: payloadBuffers[3] },
      { name: 'ride-presets.json', content: payloadBuffers[4] },
    ]);

    return {
      archiveBuffer,
      archiveChecksum: createHash('sha256').update(archiveBuffer).digest('hex'),
      sizeBytes: archiveBuffer.length,
      manifest,
    };
  }
}
