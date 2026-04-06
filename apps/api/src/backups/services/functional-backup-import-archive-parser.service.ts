import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  BACKUP_MANIFEST_VERSION,
  DEFAULT_BACKUP_IMPORT_MAX_COMPRESSION_RATIO,
  DEFAULT_BACKUP_IMPORT_MAX_ENTRY_BYTES,
  DEFAULT_BACKUP_IMPORT_MAX_ENTRY_COUNT,
  DEFAULT_BACKUP_IMPORT_MAX_UNCOMPRESSED_BYTES,
} from '../backups.constants';
import {
  readZipArchiveFromSource,
  ZipArchiveValidationError,
} from '../utils/zip-reader.util';
import type { FunctionalBackupManifest } from './functional-backup-archive.service';
import type {
  FunctionalBackupImportDataset,
  ImportedBalanceTransactionRecord,
  ImportedClientPaymentRecord,
  ImportedClientRecord,
  ImportedRidePresetRecord,
  ImportedRideRecord,
  ParsedFunctionalBackupArchive,
} from './functional-backup-import.types';

@Injectable()
export class FunctionalBackupImportArchiveParserService {
  async parseArchiveSource(
    source: AsyncIterable<Buffer | Uint8Array | string>,
    onChunk?: (chunk: Buffer) => Promise<void> | void,
  ): Promise<ParsedFunctionalBackupArchive> {
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

      return {
        dataset,
        archiveChecksum: archiveHash.digest('hex'),
        sizeBytes,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ZipArchiveValidationError
      ) {
        throw error;
      }

      throw error;
    }
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

    const manifest = parsed as FunctionalBackupManifest;

    if (manifest.version !== BACKUP_MANIFEST_VERSION) {
      throw new BadRequestException(
        `Versao de backup nao suportada: ${manifest.version}.`,
      );
    }

    return manifest;
  }
}
