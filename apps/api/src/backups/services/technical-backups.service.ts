import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Readable } from 'node:stream';
import { BackupsRepository } from '../backups.repository';
import type { BackupJobRecord } from '../backups.repository';
import {
  DEFAULT_BACKUP_HISTORY_LIMIT,
  DEFAULT_BACKUP_SIGNED_URL_TTL_SECONDS,
  TECHNICAL_BACKUP_KIND,
} from '../backups.constants';
import { getBackupPublicErrorMessage } from '../backups-public-errors';
import type { BackupStorageReference } from '../interfaces/backup-storage-provider.interface';
import { BackupJobOrchestratorService } from './backup-job-orchestrator.service';
import { BackupStorageRegistryService } from './backup-storage-registry.service';

@Injectable()
export class TechnicalBackupsService {
  private readonly logger = new Logger(TechnicalBackupsService.name);
  private readonly historyLimit: number;
  private readonly signedUrlTtlSeconds: number;

  constructor(
    private readonly backupsRepository: BackupsRepository,
    private readonly backupJobOrchestratorService: BackupJobOrchestratorService,
    private readonly backupStorageRegistry: BackupStorageRegistryService,
    private readonly configService: ConfigService,
  ) {
    this.historyLimit = this.configService.get<number>(
      'BACKUP_HISTORY_LIMIT',
      DEFAULT_BACKUP_HISTORY_LIMIT,
    );
    this.signedUrlTtlSeconds = this.configService.get<number>(
      'BACKUP_SIGNED_URL_TTL_SECONDS',
      DEFAULT_BACKUP_SIGNED_URL_TTL_SECONDS,
    );
  }

  async createManualBackup(actorUserId: string) {
    this.logger.log({
      context: 'technicalBackups.createManualBackup:start',
      actorUserId,
    });

    if (this.configService.get<string>('PG_DUMP_BACKUP_ENABLED') === 'false') {
      this.logger.warn({
        context: 'technicalBackups.createManualBackup:disabled',
        actorUserId,
      });
      throw new ServiceUnavailableException(
        'O backup sistemico por pg_dump esta desativado neste ambiente.',
      );
    }

    try {
      const job =
        await this.backupJobOrchestratorService.createManualTechnicalBackup(
          actorUserId,
        );

      this.logger.log({
        context: 'technicalBackups.createManualBackup:success',
        actorUserId,
        backupJobId: job.id,
      });

      return this.toResponse(job);
    } catch (error) {
      this.logOperationalError('technicalBackups.createManualBackup:error', error, {
        actorUserId,
      });
      throw error;
    }
  }

  async listBackups() {
    this.logger.log({
      context: 'technicalBackups.listBackups:start',
      historyLimit: this.historyLimit,
    });

    try {
      const jobs = await this.backupsRepository.listTechnicalJobs(
        this.historyLimit,
      );

      this.logger.log({
        context: 'technicalBackups.listBackups:success',
        count: jobs.length,
      });

      return jobs.map((job) => this.toResponse(job));
    } catch (error) {
      this.logOperationalError('technicalBackups.listBackups:error', error, {
        historyLimit: this.historyLimit,
      });

      if (this.isSchemaError(error)) {
        throw this.getUnavailableException();
      }

      throw error;
    }
  }

  async getDownloadUrl(id: string) {
    this.logger.log({
      context: 'technicalBackups.getDownloadUrl:start',
      backupJobId: id,
    });

    let job;

    try {
      job = await this.backupsRepository.findTechnicalJob(id);
    } catch (error) {
      this.logOperationalError('technicalBackups.getDownloadUrl:error', error, {
        backupJobId: id,
      });

      if (this.isSchemaError(error)) {
        throw this.getUnavailableException();
      }

      throw error;
    }

    if (!job) {
      this.logger.warn({
        context: 'technicalBackups.getDownloadUrl:notFound',
        backupJobId: id,
      });
      throw new NotFoundException('Backup tecnico nao encontrado.');
    }

    const response = await this.buildSignedDownloadResponse(job);

    this.logger.log({
      context: 'technicalBackups.getDownloadUrl:success',
      backupJobId: id,
      status: job.status,
    });

    return response;
  }

  async getDownloadFile(id: string): Promise<{
    stream: Readable;
    fileName: string;
    contentType: string;
  }> {
    this.logger.log({
      context: 'technicalBackups.getDownloadFile:start',
      backupJobId: id,
    });

    const job = await this.backupsRepository.findTechnicalJob(id);

    if (!job) {
      this.logger.warn({
        context: 'technicalBackups.getDownloadFile:notFound',
        backupJobId: id,
      });
      throw new NotFoundException('Backup tecnico nao encontrado.');
    }

    if (job.status !== 'success' || !job.storageKey) {
      this.logger.warn({
        context: 'technicalBackups.getDownloadFile:notReady',
        backupJobId: id,
        status: job.status,
      });
      throw new BadRequestException(
        'O backup ainda nao esta disponivel para download.',
      );
    }

    const reference = this.getStorageReference(job);
    const stream = await this.backupStorageRegistry
      .getProvider(reference.providerId)
      .download(reference);

    this.logger.log({
      context: 'technicalBackups.getDownloadFile:success',
      backupJobId: id,
      providerId: reference.providerId,
      storageKey: reference.key,
    });

    return {
      stream,
      fileName: reference.fileName,
      contentType: reference.contentType,
    };
  }

  private safeParseMetadata(
    metadataJson?: string | null,
  ): Record<string, unknown> | null {
    if (!metadataJson) {
      return null;
    }

    try {
      return JSON.parse(metadataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private getTechnicalWarnings(metadata: Record<string, unknown> | null) {
    if (!metadata || metadata.fallbackUsed !== true) {
      return [];
    }

    const providerId =
      typeof metadata.storageProviderId === 'string'
        ? metadata.storageProviderId
        : 'desconhecido';
    const fallbackFromProviderId =
      typeof metadata.fallbackFromProviderId === 'string'
        ? metadata.fallbackFromProviderId
        : 'desconhecido';

    return [
      `Upload concluido via fallback no provider ${providerId} apos falha no provider ${fallbackFromProviderId}.`,
    ];
  }

  private toResponse(job: BackupJobRecord) {
    const metadata = this.safeParseMetadata(job.metadataJson);

    return {
      id: job.id,
      kind: job.kind,
      trigger: job.trigger,
      status: job.status,
      checksum: job.checksum ?? null,
      sizeBytes: job.sizeBytes ?? null,
      manifestVersion: job.manifestVersion,
      errorMessage:
        job.status === 'failed'
          ? (job.errorMessage ??
            getBackupPublicErrorMessage('processTechnicalJob'))
          : null,
      createdAt: job.createdAt,
      startedAt: job.startedAt ?? null,
      finishedAt: job.finishedAt ?? null,
      metadata,
      displayName:
        typeof metadata?.displayFileName === 'string'
          ? metadata.displayFileName
          : null,
      warnings: this.getTechnicalWarnings(metadata),
    };
  }

  private getStorageReference(job: BackupJobRecord): BackupStorageReference {
    const metadata = this.safeParseMetadata(job.metadataJson);

    return {
      providerId:
        typeof metadata?.storageProviderId === 'string'
          ? metadata.storageProviderId
          : 'r2',
      key: job.storageKey ?? '',
      fileName:
        typeof metadata?.storageFileName === 'string'
          ? metadata.storageFileName
          : this.buildDownloadFileName(job.createdAt),
      contentType:
        typeof metadata?.storageContentType === 'string'
          ? metadata.storageContentType
          : 'application/gzip',
    };
  }

  private isSchemaError(error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido';

    return (
      message.includes('backup_jobs') ||
      message.includes('backup_import_jobs') ||
      message.includes('backup_job_kind') ||
      message.includes('backup_job_trigger') ||
      message.includes('backup_import_job_status') ||
      message.includes('technical_full') ||
      message.includes('relation') ||
      message.includes('does not exist') ||
      message.includes('invalid input value for enum')
    );
  }

  private getUnavailableException() {
    return new ServiceUnavailableException(
      'O schema de backups do PostgreSQL ainda nao esta pronto. Aplique as migrations do pacote @mdc/database antes de usar os backups tecnicos.',
    );
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Erro desconhecido';
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

  private async buildSignedDownloadResponse(job: BackupJobRecord) {
    if (job.status !== 'success' || !job.storageKey) {
      throw new BadRequestException(
        'O backup ainda nao esta disponivel para download.',
      );
    }

    return {
      id: job.id,
      url: `/api/admin/backups/technical/${job.id}/file`,
      expiresInSeconds: this.signedUrlTtlSeconds,
    };
  }

  private buildDownloadFileName(createdAt: Date | string) {
    const isoDate =
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt);
    const safeDate = isoDate.replace(/[:.]/g, '-');

    return `${TECHNICAL_BACKUP_KIND.replace('_full', '')}-backup-${safeDate}.sql.gz`;
  }
}
