import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { BACKUP_MANIFEST_VERSION } from '../backups.constants';
import type {
  FunctionalBackupImportDataset,
  FunctionalBackupImportPreview,
  ImportableBackupModuleName,
} from './functional-backup-import.types';

const RIDE_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'] as const;
const RIDE_PAYMENT_STATUSES = ['PENDING', 'PAID'] as const;
const CLIENT_PAYMENT_STATUSES = ['UNUSED', 'USED'] as const;
const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'] as const;
const TRANSACTION_ORIGINS = [
  'PAYMENT_OVERFLOW',
  'RIDE_USAGE',
  'MANUAL_ADJUSTMENT',
] as const;

@Injectable()
export class FunctionalBackupImportDatasetValidatorService {
  buildPreview(
    dataset: FunctionalBackupImportDataset,
    archiveMetadata: { archiveChecksum: string; sizeBytes: number },
  ): FunctionalBackupImportPreview {
    const preview = this.validateDataset(dataset);

    return {
      ...preview,
      archiveChecksum: archiveMetadata.archiveChecksum,
      sizeBytes: archiveMetadata.sizeBytes,
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
}
