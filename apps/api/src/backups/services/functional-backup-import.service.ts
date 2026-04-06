/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import { UserDashboardCacheService } from '../../cache/user-dashboard-cache.service';
import { STORAGE_PROVIDER } from '../../storage/interfaces/storage-provider.interface';
import type { IStorageProvider } from '../../storage/interfaces/storage-provider.interface';
import { BackupsRepository } from '../backups.repository';
import {
  BACKUP_MANIFEST_VERSION,
  DEFAULT_BACKUP_IMPORT_MAX_COMPRESSION_RATIO,
  DEFAULT_BACKUP_IMPORT_MAX_ENTRY_BYTES,
  DEFAULT_BACKUP_IMPORT_MAX_ENTRY_COUNT,
  DEFAULT_BACKUP_IMPORT_MAX_UNCOMPRESSED_BYTES,
  DEFAULT_BACKUP_STORAGE_PREFIX,
} from '../backups.constants';
import { getBackupPublicErrorMessage } from '../backups-public-errors';
import type { FunctionalBackupManifest } from './functional-backup-archive.service';
import { FunctionalBackupArchiveService } from './functional-backup-archive.service';
import type { BackupImportUploadSource } from '../utils/backup-import-upload.util';
import { readZipArchiveFromSource } from '../utils/zip-reader.util';

type ImportableBackupModuleName =
  | 'clients'
  | 'rides'
  | 'client_payments'
  | 'balance_transactions'
  | 'ride_presets';

interface ImportedClientRecord {
  id: string;
  displayId?: number | null;
  userId?: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  balance?: number | string | null;
  isPinned?: boolean;
  createdAt?: string | Date | null;
}

interface ImportedRideRecord {
  id: string;
  displayId?: number | null;
  clientId: string;
  userId?: string;
  value: number | string;
  location?: string | null;
  notes?: string | null;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PAID';
  paidWithBalance?: number | string | null;
  debtValue?: number | string | null;
  rideDate?: string | Date | null;
  photo?: string | null;
  createdAt?: string | Date | null;
}

interface ImportedClientPaymentRecord {
  id: string;
  clientId: string;
  userId?: string;
  amount: number | string;
  paymentDate?: string | Date | null;
  status?: 'UNUSED' | 'USED';
  notes?: string | null;
  createdAt?: string | Date | null;
}

interface ImportedBalanceTransactionRecord {
  id: string;
  clientId: string;
  userId?: string;
  amount: number | string;
  type: 'CREDIT' | 'DEBIT';
  origin: 'PAYMENT_OVERFLOW' | 'RIDE_USAGE' | 'MANUAL_ADJUSTMENT';
  description?: string | null;
  createdAt?: string | Date | null;
}

interface ImportedRidePresetRecord {
  id: string;
  userId?: string;
  label: string;
  value: number | string;
  location: string;
  createdAt?: string | Date | null;
}

interface FunctionalBackupImportDataset {
  manifest: FunctionalBackupManifest;
  clients: ImportedClientRecord[];
  rides: ImportedRideRecord[];
  clientPayments: ImportedClientPaymentRecord[];
  balanceTransactions: ImportedBalanceTransactionRecord[];
  ridePresets: ImportedRidePresetRecord[];
}

interface ParsedArchiveResult {
  archiveChecksum: string;
  dataset: FunctionalBackupImportDataset;
  preview: Omit<
    FunctionalBackupImportPreview,
    'archiveChecksum' | 'sizeBytes'
  >;
  sizeBytes: number;
}

const RIDE_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'] as const;
const RIDE_PAYMENT_STATUSES = ['PENDING', 'PAID'] as const;
const CLIENT_PAYMENT_STATUSES = ['UNUSED', 'USED'] as const;
const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'] as const;
const TRANSACTION_ORIGINS = [
  'PAYMENT_OVERFLOW',
  'RIDE_USAGE',
  'MANUAL_ADJUSTMENT',
] as const;

export interface FunctionalBackupImportPreview {
  manifestVersion: number;
  ownerUserId: string;
  ownerName: string | null;
  createdAt: string;
  archiveChecksum: string;
  sizeBytes: number;
  modules: ImportableBackupModuleName[];
  counts: Record<ImportableBackupModuleName, number>;
  warnings: string[];
}

export type FunctionalBackupImportJobStatus =
  | 'validated'
  | 'running'
  | 'success'
  | 'failed';

export type FunctionalBackupImportJobPhase =
  | 'validated'
  | 'backing_up'
  | 'importing'
  | 'completed'
  | 'failed';

export interface FunctionalBackupImportJobResponse {
  id: string;
  status: FunctionalBackupImportJobStatus;
  phase: FunctionalBackupImportJobPhase;
  preview: FunctionalBackupImportPreview;
  errorMessage: string | null;
  createdAt: Date | string | null;
  startedAt: Date | string | null;
  finishedAt: Date | string | null;
}

@Injectable()
export class FunctionalBackupImportService {
  private readonly logger = new Logger(FunctionalBackupImportService.name);
  private readonly storagePrefix: string;

  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
    private readonly backupsRepository: BackupsRepository,
    private readonly configService: ConfigService,
    private readonly functionalBackupArchiveService: FunctionalBackupArchiveService,
    private readonly userDashboardCacheService: UserDashboardCacheService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {
    this.storagePrefix =
      this.configService.get<string>('BACKUP_STORAGE_PREFIX') ??
      DEFAULT_BACKUP_STORAGE_PREFIX;
  }

  private get db() {
    return this.drizzle.db;
  }

  private get schema() {
    return this.drizzle.schema;
  }

  private parseJsonArray<T>(value: Buffer, fileName: string): T[] {
    let parsed: unknown;

    try {
      parsed = JSON.parse(value.toString('utf8')) as unknown;
    } catch {
      throw new BadRequestException(`Conteudo JSON invalido em ${fileName}.`);
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException(`${fileName} deve conter um array JSON.`);
    }

    return parsed as T[];
  }

  private parseManifest(value: Buffer): FunctionalBackupManifest {
    let parsed: unknown;

    try {
      parsed = JSON.parse(value.toString('utf8')) as unknown;
    } catch {
      throw new BadRequestException('manifest.json invalido.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new BadRequestException('manifest.json invalido.');
    }

    return parsed as FunctionalBackupManifest;
  }

  private normalizeDate(value?: string | Date | null) {
    if (!value) {
      return null;
    }

    const normalized = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(normalized.getTime())) {
      throw new BadRequestException('Arquivo de backup contem data invalida.');
    }

    return normalized;
  }

  private buildImportStorageKey(userId: string, importJobId: string) {
    const dateSegment = new Date().toISOString().slice(0, 10);
    return `${this.storagePrefix}/imports/${userId}/${dateSegment}/${importJobId}.zip`;
  }

  private buildPreImportStorageKey(userId: string, backupJobId: string) {
    const dateSegment = new Date().toISOString().slice(0, 10);
    return `${this.storagePrefix}/users/${userId}/pre-import/${dateSegment}/${backupJobId}.zip`;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }

  private safeParsePreview(previewJson: string) {
    try {
      return JSON.parse(previewJson) as FunctionalBackupImportPreview;
    } catch {
      throw new BadRequestException(
        'Os dados desta importacao nao estao mais disponiveis.',
      );
    }
  }

  private toImportJobResponse(job: {
    id: string;
    status: FunctionalBackupImportJobStatus;
    phase?: FunctionalBackupImportJobPhase | null;
    previewJson: string;
    errorMessage?: string | null;
    createdAt?: Date | string | null;
    startedAt?: Date | string | null;
    finishedAt?: Date | string | null;
  }): FunctionalBackupImportJobResponse {
    return {
      id: job.id,
      status: job.status,
      phase: job.phase ?? this.derivePhaseFromStatus(job.status),
      preview: this.safeParsePreview(job.previewJson),
      errorMessage: job.errorMessage ?? null,
      createdAt: job.createdAt ?? null,
      startedAt: job.startedAt ?? null,
      finishedAt: job.finishedAt ?? null,
    };
  }

  private derivePhaseFromStatus(status: FunctionalBackupImportJobStatus) {
    switch (status) {
      case 'running':
        return 'importing';
      case 'success':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'validated':
      default:
        return 'validated';
    }
  }

  private logOperationalError(
    context: string,
    error: unknown,
    metadata?: Record<string, unknown>,
  ) {
    this.logger.error(
      {
        context,
        ...metadata,
        message: this.getErrorMessage(error),
      },
      error instanceof Error ? error.stack : undefined,
    );
  }

  private logArchiveRejection(
    context: string,
    userId: string,
    originalname: string | undefined,
    error: unknown,
  ) {
    this.logger.warn({
      context,
      userId,
      originalname: originalname ?? null,
      message: this.getErrorMessage(error),
    });
  }

  private async writeChunkToWritable(stream: PassThrough, chunk: Buffer) {
    if (stream.destroyed || !stream.writable) {
      throw new Error('Upload de backup interrompido.');
    }

    if (stream.write(chunk)) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        stream.off('drain', handleDrain);
        stream.off('error', handleError);
        stream.off('close', handleClose);
      };

      const handleDrain = () => {
        cleanup();
        resolve();
      };

      const handleError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const handleClose = () => {
        cleanup();
        reject(new Error('Upload de backup interrompido.'));
      };

      stream.once('drain', handleDrain);
      stream.once('error', handleError);
      stream.once('close', handleClose);
    });
  }

  private computeBalances(
    clients: ImportedClientRecord[],
    balanceTransactions: ImportedBalanceTransactionRecord[],
  ) {
    const balances = new Map<string, number>();

    for (const client of clients) {
      balances.set(client.id, 0);
    }

    for (const transaction of balanceTransactions) {
      const current = balances.get(transaction.clientId) ?? 0;
      const amount = this.parseNumericValue(
        transaction.amount,
        `transacao ${transaction.id} valor`,
      );
      const next =
        transaction.type === 'DEBIT' ? current - amount : current + amount;

      balances.set(transaction.clientId, next);
    }

    return balances;
  }

  private parseNumericValue(
    value: number | string | null | undefined,
    fieldLabel: string,
  ) {
    if (value === null || value === undefined) {
      throw new BadRequestException(
        `Arquivo de backup contem valor numerico ausente em ${fieldLabel}.`,
      );
    }

    if (typeof value === 'string' && value.trim() === '') {
      throw new BadRequestException(
        `Arquivo de backup contem valor numerico vazio em ${fieldLabel}.`,
      );
    }

    const normalized = Number(value);

    if (!Number.isFinite(normalized)) {
      throw new BadRequestException(
        `Arquivo de backup contem valor numerico invalido em ${fieldLabel}.`,
      );
    }

    return normalized;
  }

  private parseOptionalNumericValue(
    value: number | string | null | undefined,
    fieldLabel: string,
  ) {
    if (value === null || value === undefined) {
      return null;
    }

    return this.parseNumericValue(value, fieldLabel);
  }

  private validateUniqueIds<T extends { id: string }>(
    records: T[],
    entityLabel: string,
  ) {
    const ids = new Set(records.map((record) => record.id));

    if (ids.size !== records.length) {
      throw new BadRequestException(
        `Arquivo de backup contem ${entityLabel} duplicados.`,
      );
    }
  }

  private validateEnumValue<T extends string>(
    value: string | undefined,
    allowedValues: readonly T[],
    fieldLabel: string,
  ) {
    if (!value) {
      return;
    }

    if (!allowedValues.includes(value as T)) {
      throw new BadRequestException(
        `Arquivo de backup contem valor invalido em ${fieldLabel}.`,
      );
    }
  }

  private toClientInsertRecord(
    client: ImportedClientRecord,
    userId: string,
    balance: number,
  ) {
    return {
      id: client.id,
      userId,
      name: client.name,
      phone: client.phone ?? null,
      address: client.address ?? null,
      balance,
      isPinned: Boolean(client.isPinned),
      createdAt: this.normalizeDate(client.createdAt) ?? new Date(),
    };
  }

  private toRideInsertRecord(ride: ImportedRideRecord, userId: string) {
    return {
      id: ride.id,
      clientId: ride.clientId,
      userId,
      value: ride.value,
      location: ride.location ?? null,
      notes: ride.notes ?? null,
      status: ride.status ?? 'COMPLETED',
      paymentStatus: ride.paymentStatus ?? 'PAID',
      paidWithBalance: ride.paidWithBalance ?? 0,
      debtValue: ride.debtValue ?? 0,
      rideDate: this.normalizeDate(ride.rideDate),
      photo: null,
      createdAt: this.normalizeDate(ride.createdAt) ?? new Date(),
    };
  }

  private toClientPaymentInsertRecord(
    payment: ImportedClientPaymentRecord,
    userId: string,
  ) {
    return {
      id: payment.id,
      clientId: payment.clientId,
      userId,
      amount: payment.amount,
      paymentDate: this.normalizeDate(payment.paymentDate) ?? new Date(),
      status: payment.status ?? 'UNUSED',
      notes: payment.notes ?? null,
      createdAt: this.normalizeDate(payment.createdAt) ?? new Date(),
    };
  }

  private toBalanceTransactionInsertRecord(
    transaction: ImportedBalanceTransactionRecord,
    userId: string,
  ) {
    return {
      id: transaction.id,
      clientId: transaction.clientId,
      userId,
      amount: transaction.amount,
      type: transaction.type,
      origin: transaction.origin,
      description: transaction.description ?? null,
      createdAt: this.normalizeDate(transaction.createdAt) ?? new Date(),
    };
  }

  private toRidePresetInsertRecord(
    preset: ImportedRidePresetRecord,
    userId: string,
  ) {
    return {
      id: preset.id,
      userId,
      label: preset.label,
      value: preset.value,
      location: preset.location,
      createdAt: this.normalizeDate(preset.createdAt) ?? new Date(),
    };
  }

  private validateDataset(dataset: FunctionalBackupImportDataset) {
    const modules = [
      'clients',
      'rides',
      'client_payments',
      'balance_transactions',
      'ride_presets',
    ] as const;
    const warnings: string[] = [];

    if (dataset.manifest.version !== BACKUP_MANIFEST_VERSION) {
      throw new BadRequestException(
        `Versao de backup nao suportada: ${dataset.manifest.version}.`,
      );
    }

    if (dataset.manifest.kind !== 'functional_user') {
      throw new BadRequestException('Este arquivo nao e um backup funcional.');
    }

    for (const moduleName of modules) {
      if (!dataset.manifest.modules.includes(moduleName)) {
        throw new BadRequestException(
          `manifest.json nao inclui o modulo ${moduleName}.`,
        );
      }
    }

    const counts = {
      clients: dataset.clients.length,
      rides: dataset.rides.length,
      client_payments: dataset.clientPayments.length,
      balance_transactions: dataset.balanceTransactions.length,
      ride_presets: dataset.ridePresets.length,
    };

    for (const [key, count] of Object.entries(counts)) {
      const manifestCount =
        dataset.manifest.counts[key as ImportableBackupModuleName];

      if (manifestCount !== count) {
        throw new BadRequestException(
          `Contagem inconsistente no modulo ${key}.`,
        );
      }
    }

    const payloadChecksum = createHash('sha256')
      .update(
        Buffer.concat([
          Buffer.from(JSON.stringify(dataset.clients)),
          Buffer.from(JSON.stringify(dataset.rides)),
          Buffer.from(JSON.stringify(dataset.clientPayments)),
          Buffer.from(JSON.stringify(dataset.balanceTransactions)),
          Buffer.from(JSON.stringify(dataset.ridePresets)),
        ]),
      )
      .digest('hex');

    if (payloadChecksum !== dataset.manifest.sha256) {
      throw new BadRequestException('Checksum logico do backup invalido.');
    }

    this.normalizeDate(dataset.manifest.createdAt);
    this.validateUniqueIds(dataset.clients, 'clientes');
    this.validateUniqueIds(dataset.rides, 'corridas');
    this.validateUniqueIds(dataset.clientPayments, 'pagamentos');
    this.validateUniqueIds(dataset.balanceTransactions, 'transacoes');
    this.validateUniqueIds(dataset.ridePresets, 'atalhos de corrida');

    if (
      dataset.clients.some(
        (client) => client.displayId !== null && client.displayId !== undefined,
      ) ||
      dataset.rides.some(
        (ride) => ride.displayId !== null && ride.displayId !== undefined,
      ) ||
      dataset.clients.some((client) => client.userId) ||
      dataset.rides.some((ride) => ride.userId) ||
      dataset.clientPayments.some((payment) => payment.userId) ||
      dataset.balanceTransactions.some((transaction) => transaction.userId) ||
      dataset.ridePresets.some((preset) => preset.userId)
    ) {
      warnings.push(
        'Identificadores internos do sistema serao ignorados e regenerados durante a importacao.',
      );
    }

    if (dataset.clients.some((client) => client.balance !== undefined)) {
      warnings.push(
        'Os saldos dos clientes serao recalculados com base nas transacoes do backup.',
      );
    }

    const clientIds = new Set(dataset.clients.map((client) => client.id));

    for (const client of dataset.clients) {
      this.normalizeDate(client.createdAt);
    }

    for (const ride of dataset.rides) {
      if (!clientIds.has(ride.clientId)) {
        throw new BadRequestException(
          `Corrida ${ride.id} referencia um cliente inexistente.`,
        );
      }

      this.validateEnumValue(
        ride.status,
        RIDE_STATUSES,
        `status da corrida ${ride.id}`,
      );
      this.validateEnumValue(
        ride.paymentStatus,
        RIDE_PAYMENT_STATUSES,
        `status de pagamento da corrida ${ride.id}`,
      );
      this.parseNumericValue(ride.value, `corrida ${ride.id} valor`);
      this.parseOptionalNumericValue(
        ride.paidWithBalance,
        `corrida ${ride.id} pago com saldo`,
      );
      this.parseOptionalNumericValue(
        ride.debtValue,
        `corrida ${ride.id} valor em aberto`,
      );
      this.normalizeDate(ride.rideDate);
      this.normalizeDate(ride.createdAt);

      if (ride.photo) {
        warnings.push(
          'O backup contem referencias de fotos em corridas; elas serao removidas na importacao.',
        );
        break;
      }
    }

    for (const payment of dataset.clientPayments) {
      if (!clientIds.has(payment.clientId)) {
        throw new BadRequestException(
          `Pagamento ${payment.id} referencia um cliente inexistente.`,
        );
      }

      this.validateEnumValue(
        payment.status,
        CLIENT_PAYMENT_STATUSES,
        `status do pagamento ${payment.id}`,
      );
      this.parseNumericValue(payment.amount, `pagamento ${payment.id} valor`);
      this.normalizeDate(payment.paymentDate);
      this.normalizeDate(payment.createdAt);
    }

    for (const transaction of dataset.balanceTransactions) {
      if (!clientIds.has(transaction.clientId)) {
        throw new BadRequestException(
          `Transacao ${transaction.id} referencia um cliente inexistente.`,
        );
      }

      this.validateEnumValue(
        transaction.type,
        TRANSACTION_TYPES,
        `tipo da transacao ${transaction.id}`,
      );
      this.validateEnumValue(
        transaction.origin,
        TRANSACTION_ORIGINS,
        `origem da transacao ${transaction.id}`,
      );
      this.parseNumericValue(
        transaction.amount,
        `transacao ${transaction.id} valor`,
      );
      this.normalizeDate(transaction.createdAt);
    }

    for (const preset of dataset.ridePresets) {
      this.parseNumericValue(preset.value, `atalho ${preset.id} valor`);
      this.normalizeDate(preset.createdAt);
    }

    return {
      manifestVersion: dataset.manifest.version,
      ownerUserId: dataset.manifest.ownerUserId,
      ownerName: dataset.manifest.ownerName ?? null,
      createdAt: dataset.manifest.createdAt,
      modules: dataset.manifest.modules,
      counts,
      warnings,
    };
  }

  private async parseArchiveSource(
    source: AsyncIterable<Buffer | Uint8Array | string>,
    onChunk?: (chunk: Buffer) => Promise<void> | void,
  ): Promise<ParsedArchiveResult> {
    try {
      const requiredFiles = [
        'manifest.json',
        'clients.json',
        'rides.json',
        'client-payments.json',
        'balance-transactions.json',
        'ride-presets.json',
      ] as const;
      const archiveHash = createHash('sha256');
      let sizeBytes = 0;
      const entries = await readZipArchiveFromSource(source, {
        allowedEntryNames: requiredFiles,
        blockNestedZip: true,
        maxCompressionRatio: DEFAULT_BACKUP_IMPORT_MAX_COMPRESSION_RATIO,
        maxEntries: DEFAULT_BACKUP_IMPORT_MAX_ENTRY_COUNT,
        maxEntryBytes: DEFAULT_BACKUP_IMPORT_MAX_ENTRY_BYTES,
        maxTotalUncompressedBytes: DEFAULT_BACKUP_IMPORT_MAX_UNCOMPRESSED_BYTES,
        onChunk: async (chunk) => {
          archiveHash.update(chunk);
          sizeBytes += chunk.length;

          if (onChunk) {
            await onChunk(chunk);
          }
        },
      });
      const entriesMap = new Map(entries.map((entry) => [entry.name, entry]));

      for (const fileName of requiredFiles) {
        if (!entriesMap.has(fileName)) {
          throw new BadRequestException(`Arquivo ausente no ZIP: ${fileName}.`);
        }
      }

      const dataset: FunctionalBackupImportDataset = {
        manifest: this.parseManifest(entriesMap.get('manifest.json')!.content),
        clients: this.parseJsonArray<ImportedClientRecord>(
          entriesMap.get('clients.json')!.content,
          'clients.json',
        ),
        rides: this.parseJsonArray<ImportedRideRecord>(
          entriesMap.get('rides.json')!.content,
          'rides.json',
        ),
        clientPayments: this.parseJsonArray<ImportedClientPaymentRecord>(
          entriesMap.get('client-payments.json')!.content,
          'client-payments.json',
        ),
        balanceTransactions:
          this.parseJsonArray<ImportedBalanceTransactionRecord>(
            entriesMap.get('balance-transactions.json')!.content,
            'balance-transactions.json',
          ),
        ridePresets: this.parseJsonArray<ImportedRidePresetRecord>(
          entriesMap.get('ride-presets.json')!.content,
          'ride-presets.json',
        ),
      };

      const preview = this.validateDataset(dataset);

      return {
        dataset,
        preview,
        archiveChecksum: archiveHash.digest('hex'),
        sizeBytes,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(this.getErrorMessage(error));
    }
  }

  private buildPreviewPayload(parsed: ParsedArchiveResult) {
    return {
      ...parsed.preview,
      archiveChecksum: parsed.archiveChecksum,
      sizeBytes: parsed.sizeBytes,
    };
  }

  private async cleanupUploadedArchive(
    storageKey: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await this.storageProvider.delete(storageKey, {
        visibility: 'private',
      });
    } catch (error) {
      this.logOperationalError('previewImport.cleanupUploadedArchive', error, {
        storageKey,
        ...metadata,
      });
    }
  }

  async previewImport(userId: string, upload: BackupImportUploadSource) {
    const importJobId = randomUUID();
    const storageKey = this.buildImportStorageKey(userId, importJobId);
    const uploadStream = new PassThrough();
    let uploadCompleted = false;

    const uploadPromise = this.storageProvider
      .uploadPrivateStream(
        {
          stream: uploadStream,
          mimetype: upload.mimetype,
          originalname: upload.originalname || `${importJobId}.zip`,
        },
        storageKey,
        {
          contentDisposition: `attachment; filename="${importJobId}.zip"`,
        },
      )
      .then((result) => {
        uploadCompleted = true;
        return result;
      });

    try {
      const parsed = await this.parseArchiveSource(
        upload.stream as AsyncIterable<Buffer | Uint8Array | string>,
        async (chunk) => {
          await this.writeChunkToWritable(uploadStream, chunk);
        },
      );

      uploadStream.end();
      await upload.completed;
      await uploadPromise;

      const previewPayload = this.buildPreviewPayload(parsed);
      const importJob = await this.backupsRepository.createImportJob({
        id: importJobId,
        scopeUserId: userId,
        actorUserId: userId,
        uploadedStorageKey: storageKey,
        archiveChecksum: parsed.archiveChecksum,
        sizeBytes: parsed.sizeBytes,
        manifestVersion: parsed.preview.manifestVersion,
        previewJson: JSON.stringify(previewPayload),
      });

      return this.toImportJobResponse({
        id: importJob.id,
        status: 'validated',
        phase: 'validated',
        previewJson: JSON.stringify(previewPayload),
        errorMessage: null,
        createdAt: importJob.createdAt ?? null,
        startedAt: null,
        finishedAt: null,
      });
    } catch (error) {
      upload.cancel(error instanceof Error ? error : undefined);
      uploadStream.destroy(
        error instanceof Error ? error : new Error('Importacao interrompida.'),
      );

      try {
        await uploadPromise;
      } catch {
        // The original failure is handled below.
      }

      if (uploadCompleted) {
        await this.cleanupUploadedArchive(storageKey, {
          importJobId,
          originalname: upload.originalname,
          userId,
        });
      }

      if (error instanceof BadRequestException) {
        this.logArchiveRejection(
          'previewImport.rejectedArchive',
          userId,
          upload.originalname,
          error,
        );
        throw error;
      }

      this.logOperationalError('previewImport.streamingPipeline', error, {
        importJobId,
        originalname: upload.originalname,
        storageKey,
        userId,
      });
      throw new BadRequestException(
        getBackupPublicErrorMessage('previewUpload'),
      );
    }
  }

  private async createPreImportBackup(userId: string, actorUserId: string) {
    const job = await this.backupsRepository.createPreImportJob(
      userId,
      actorUserId,
    );
    await this.backupsRepository.markRunning(job.id);

    try {
      const archive =
        await this.functionalBackupArchiveService.buildArchive(userId);
      const storageKey = this.buildPreImportStorageKey(userId, job.id);

      await this.storageProvider.uploadPrivate(
        {
          buffer: archive.archiveBuffer,
          mimetype: 'application/zip',
          originalname: `${job.id}.zip`,
        },
        storageKey,
      );

      await this.backupsRepository.markSuccess(job.id, {
        storageKey,
        checksum: archive.archiveChecksum,
        sizeBytes: archive.sizeBytes,
        metadataJson: JSON.stringify({
          counts: archive.manifest.counts,
          modules: archive.manifest.modules,
          manifestCreatedAt: archive.manifest.createdAt,
          ownerUserId: archive.manifest.ownerUserId,
          payloadChecksum: archive.manifest.sha256,
        }),
      });
    } catch (error) {
      this.logOperationalError('createPreImportBackup', error, {
        backupJobId: job.id,
        userId,
      });
      await this.backupsRepository.markFailed(
        job.id,
        getBackupPublicErrorMessage('preImport'),
      );
      throw error;
    }
  }

  async getImportStatus(userId: string, importJobId: string) {
    const importJob = await this.backupsRepository.findImportJob(
      userId,
      importJobId,
    );

    if (!importJob) {
      throw new NotFoundException('Importacao de backup nao encontrada.');
    }

    return this.toImportJobResponse(importJob);
  }

  async executeImport(userId: string, importJobId: string) {
    const importJob = await this.backupsRepository.findImportJob(
      userId,
      importJobId,
    );

    if (!importJob) {
      throw new NotFoundException('Importacao de backup nao encontrada.');
    }

    if (!importJob.uploadedStorageKey) {
      throw new BadRequestException(
        'O arquivo desta importacao nao esta mais disponivel.',
      );
    }

    if (importJob.status === 'running') {
      throw new BadRequestException(
        'Esta importacao ja esta em processamento.',
      );
    }

    if (importJob.status === 'success') {
      throw new BadRequestException(
        'Esta importacao ja foi executada com sucesso.',
      );
    }

    await this.backupsRepository.markImportRunning(importJob.id, 'backing_up');

    try {
      const archiveStream = await this.storageProvider.downloadStream(
        importJob.uploadedStorageKey,
        { visibility: 'private' },
      );
      const parsed = await this.parseArchiveSource(
        archiveStream as AsyncIterable<Buffer | Uint8Array | string>,
      );

      if (
        parsed.archiveChecksum !== importJob.archiveChecksum ||
        parsed.sizeBytes !== importJob.sizeBytes
      ) {
        throw new BadRequestException(
          'O arquivo desta importacao nao corresponde ao preview validado.',
        );
      }

      const preview = this.buildPreviewPayload(parsed);

      await this.createPreImportBackup(userId, userId);
      await this.backupsRepository.updateImportPhase(importJob.id, 'importing');

      const balances = this.computeBalances(
        parsed.dataset.clients,
        parsed.dataset.balanceTransactions,
      );

      await this.db.transaction(async (tx: any) => {
        await tx
          .delete(this.schema.ridePresets)
          .where(eq(this.schema.ridePresets.userId, userId));
        await tx
          .delete(this.schema.clients)
          .where(eq(this.schema.clients.userId, userId));

        if (parsed.dataset.clients.length > 0) {
          await tx.insert(this.schema.clients).values(
            parsed.dataset.clients.map((client) => ({
              ...this.toClientInsertRecord(
                client,
                userId,
                balances.get(client.id) ?? 0,
              ),
            })),
          );
        }

        if (parsed.dataset.ridePresets.length > 0) {
          await tx.insert(this.schema.ridePresets).values(
            parsed.dataset.ridePresets.map((preset) => ({
              ...this.toRidePresetInsertRecord(preset, userId),
            })),
          );
        }

        if (parsed.dataset.rides.length > 0) {
          await tx.insert(this.schema.rides).values(
            parsed.dataset.rides.map((ride) => ({
              ...this.toRideInsertRecord(ride, userId),
            })),
          );
        }

        if (parsed.dataset.clientPayments.length > 0) {
          await tx.insert(this.schema.clientPayments).values(
            parsed.dataset.clientPayments.map((payment) => ({
              ...this.toClientPaymentInsertRecord(payment, userId),
            })),
          );
        }

        if (parsed.dataset.balanceTransactions.length > 0) {
          await tx.insert(this.schema.balanceTransactions).values(
            parsed.dataset.balanceTransactions.map((transaction) => ({
              ...this.toBalanceTransactionInsertRecord(transaction, userId),
            })),
          );
        }
      });

      await this.userDashboardCacheService.invalidate(userId);
      await this.backupsRepository.markImportSuccess(
        importJob.id,
        JSON.stringify(preview),
      );

      return this.getImportStatus(userId, importJob.id);
    } catch (error) {
      this.logOperationalError('executeImport', error, {
        importJobId: importJob.id,
        userId,
      });
      await this.backupsRepository.markImportFailed(
        importJob.id,
        getBackupPublicErrorMessage('executeImport'),
      );
      throw error;
    }
  }
}
