import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { createHash } from 'node:crypto';
import { UsersService } from '../../users/users.service';
import { STORAGE_PROVIDER } from '../../storage/interfaces/storage-provider.interface';
import type { IStorageProvider } from '../../storage/interfaces/storage-provider.interface';
import { BackupsRepository } from '../backups.repository';
import type { BackupJobRecord } from '../backups.repository';
import {
  DEFAULT_BACKUP_QUEUE_ENQUEUE_TIMEOUT_MS,
  DEFAULT_BACKUP_RETENTION_COUNT,
  DEFAULT_BACKUP_STORAGE_PREFIX,
  DEFAULT_TECHNICAL_BACKUP_RETENTION_COUNT,
  BACKUPS_QUEUE,
  GENERATE_FUNCTIONAL_BACKUP_JOB,
  GENERATE_TECHNICAL_BACKUP_JOB,
  MANUAL_BACKUP_TRIGGER,
  RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
  RUN_TECHNICAL_BACKUP_SCHEDULE_JOB,
  SCHEDULED_BACKUP_TRIGGER,
  TECHNICAL_BACKUP_KIND,
} from '../backups.constants';
import { getBackupPublicErrorMessage } from '../backups-public-errors';
import { BackupRetentionService } from './backup-retention.service';
import { BackupStorageRegistryService } from './backup-storage-registry.service';
import { FunctionalBackupArchiveService } from './functional-backup-archive.service';
import { SystemBackupRetentionService } from './system-backup-retention.service';
import { SystemBackupSettingsService } from './system-backup-settings.service';
import { TechnicalBackupRunnerService } from './technical-backup-runner.service';

interface TechnicalBackupUploadOutcome {
  requestedProviderId: string;
  providerId: string;
  reference: {
    key: string;
    fileName: string;
    contentType: string;
  };
  fallbackUsed: boolean;
  fallbackFromProviderId: string | null;
  fallbackReason: string | null;
  uploadAttemptCount: number;
}

@Injectable()
export class BackupJobOrchestratorService {
  private readonly logger = new Logger(BackupJobOrchestratorService.name);
  private readonly retentionCount: number;
  private readonly technicalRetentionCount: number;
  private readonly storagePrefix: string;
  private readonly queueEnqueueTimeoutMs: number;

  constructor(
    private readonly backupsRepository: BackupsRepository,
    private readonly usersService: UsersService,
    private readonly functionalBackupArchiveService: FunctionalBackupArchiveService,
    private readonly technicalBackupRunnerService: TechnicalBackupRunnerService,
    private readonly backupRetentionService: BackupRetentionService,
    private readonly systemBackupRetentionService: SystemBackupRetentionService,
    private readonly systemBackupSettingsService: SystemBackupSettingsService,
    private readonly backupStorageRegistry: BackupStorageRegistryService,
    private readonly configService: ConfigService,
    @InjectQueue(BACKUPS_QUEUE)
    private readonly backupsQueue: Queue,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {
    this.retentionCount = this.configService.get<number>(
      'BACKUP_RETENTION_COUNT',
      DEFAULT_BACKUP_RETENTION_COUNT,
    );
    this.technicalRetentionCount = this.configService.get<number>(
      'TECHNICAL_BACKUP_RETENTION_COUNT',
      DEFAULT_TECHNICAL_BACKUP_RETENTION_COUNT,
    );
    this.storagePrefix =
      this.configService.get<string>('BACKUP_STORAGE_PREFIX') ??
      DEFAULT_BACKUP_STORAGE_PREFIX;
    this.queueEnqueueTimeoutMs = this.configService.get<number>(
      'BACKUP_QUEUE_ENQUEUE_TIMEOUT_MS',
      DEFAULT_BACKUP_QUEUE_ENQUEUE_TIMEOUT_MS,
    );
  }

  async createManualFunctionalBackup(userId: string) {
    const job = await this.backupsRepository.createManualFunctionalJob(userId);

    try {
      await this.enqueueBackupJob(
        GENERATE_FUNCTIONAL_BACKUP_JOB,
        { backupJobId: job.id },
        { userId, backupJobId: job.id },
      );
    } catch (error) {
      this.logOperationalError('createManualFunctionalBackup', error, {
        userId,
        backupJobId: job.id,
      });
      await this.backupsRepository.markFailed(
        job.id,
        getBackupPublicErrorMessage('createFunctionalJob'),
      );
      throw error;
    }

    return job;
  }

  async createManualTechnicalBackup(actorUserId: string) {
    let job: BackupJobRecord | undefined;

    try {
      this.logger.log({
        context: 'createManualTechnicalBackup:start',
        actorUserId,
      });

      job = await this.backupsRepository.createTechnicalJob(
        MANUAL_BACKUP_TRIGGER,
        actorUserId,
      );

      await this.enqueueBackupJob(
        GENERATE_TECHNICAL_BACKUP_JOB,
        { backupJobId: job.id },
        { actorUserId, backupJobId: job.id },
      );

      this.logger.log({
        context: 'createManualTechnicalBackup:success',
        actorUserId,
        backupJobId: job.id,
      });
    } catch (error) {
      if (this.isTechnicalBackupSchemaError(error)) {
        throw this.getTechnicalBackupUnavailableException();
      }

      this.logOperationalError('createManualTechnicalBackup', error, {
        actorUserId,
        backupJobId: job?.id,
      });
      if (job?.id) {
        await this.backupsRepository.markFailed(
          job.id,
          getBackupPublicErrorMessage('createTechnicalJob'),
        );
      }
      throw error;
    }

    return job;
  }

  async processQueueJob(name: string, data: Record<string, unknown>) {
    switch (name) {
      case GENERATE_FUNCTIONAL_BACKUP_JOB:
        if (typeof data.backupJobId !== 'string') {
          throw new BadRequestException(
            'backupJobId ausente no job de backup funcional.',
          );
        }
        await this.processFunctionalBackupJob(data.backupJobId);
        return;

      case GENERATE_TECHNICAL_BACKUP_JOB:
        if (typeof data.backupJobId !== 'string') {
          throw new BadRequestException(
            'backupJobId ausente no job de backup tecnico.',
          );
        }
        await this.processTechnicalBackupJob(data.backupJobId);
        return;

      case RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB:
        await this.enqueueScheduledFunctionalBackups();
        return;

      case RUN_TECHNICAL_BACKUP_SCHEDULE_JOB:
        await this.enqueueScheduledTechnicalBackup();
        return;

      default:
        throw new BadRequestException(`Job de backup desconhecido: ${name}.`);
    }
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }

  private isTechnicalBackupSchemaError(error: unknown) {
    const message = this.getErrorMessage(error);

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

  private getTechnicalBackupUnavailableException() {
    return new ServiceUnavailableException(
      'O schema de backups do PostgreSQL ainda nao esta pronto. Aplique as migrations do pacote @mdc/database antes de usar os backups tecnicos.',
    );
  }

  private getTechnicalBackupFailureMessage(error: unknown) {
    const message = this.getErrorMessage(error);

    if (
      message.includes('pg_dump nao foi encontrado na runtime da API') ||
      message.includes('docker compose para executar o pg_dump') ||
      message.includes('PG_DUMP_DOCKER_COMPOSE_SERVICE')
    ) {
      return message;
    }

    return getBackupPublicErrorMessage('processTechnicalJob');
  }

  private getConfiguredFallbackProviderId(primaryProviderId: string) {
    if (
      this.configService.get<string>('SYSTEM_BACKUP_FAILOVER_ENABLED') !==
      'true'
    ) {
      return null;
    }

    const fallbackProviderId =
      this.configService.get<string>('SYSTEM_BACKUP_FALLBACK_PROVIDER') ?? null;

    if (!fallbackProviderId || fallbackProviderId === primaryProviderId) {
      return null;
    }

    return fallbackProviderId;
  }

  private shouldAttemptTechnicalUploadFallback(
    primaryProviderId: string,
    error: unknown,
  ) {
    if (!this.getConfiguredFallbackProviderId(primaryProviderId)) {
      return false;
    }

    const message = this.getErrorMessage(error).toLowerCase();

    return !(
      message.includes('pg_dump') ||
      message.includes('docker compose') ||
      message.includes('provider de backup sistemico') ||
      message.includes('nao esta disponivel') ||
      message.includes('invalid environment configuration') ||
      message.includes('obrigatorio') ||
      message.includes('schema')
    );
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

  private async enqueueBackupJob(
    name: string,
    payload: Record<string, unknown>,
    metadata: Record<string, unknown>,
  ) {
    this.logger.log({
      context: 'enqueueBackupJob:start',
      name,
      ...metadata,
    });

    const enqueuePromise = this.backupsQueue.add(name, payload, {
      jobId:
        typeof payload.backupJobId === 'string'
          ? payload.backupJobId
          : undefined,
      attempts: 1,
      removeOnComplete: true,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Timeout ao enfileirar job de backup "${name}" apos ${this.queueEnqueueTimeoutMs}ms.`,
          ),
        );
      }, this.queueEnqueueTimeoutMs);

      enqueuePromise
        .finally(() => clearTimeout(timer))
        .catch(() => {
          clearTimeout(timer);
        });
    });

    await Promise.race([enqueuePromise, timeoutPromise]);

    this.logger.log({
      context: 'enqueueBackupJob:success',
      name,
      ...metadata,
    });
  }

  private buildFunctionalStorageKey(
    userId: string,
    trigger: string,
    jobId: string,
    createdAt: string,
  ) {
    const dateSegment = createdAt.slice(0, 10);
    return `${this.storagePrefix}/users/${userId}/${trigger}/${dateSegment}/${jobId}.zip`;
  }

  private buildTechnicalStorageKey(
    trigger: string,
    jobId: string,
    options?: {
      fallbackProviderId?: string | null;
    },
  ) {
    const dateSegment = new Date().toISOString().slice(0, 10);
    const fallbackSuffix = options?.fallbackProviderId
      ? `.${options.fallbackProviderId}-fallback`
      : '';

    return `${this.storagePrefix}/technical/${trigger}/${dateSegment}/${jobId}${fallbackSuffix}.sql.gz`;
  }

  private buildDownloadFileName(job: {
    kind?: BackupJobRecord['kind'];
    createdAt: Date | string;
    fallbackProviderId?: string | null;
  }) {
    const createdAt =
      job.createdAt instanceof Date
        ? job.createdAt.toISOString()
        : String(job.createdAt);
    const safeDate = createdAt.replace(/[:.]/g, '-');

    if (job.kind === TECHNICAL_BACKUP_KIND) {
      if (job.fallbackProviderId) {
        return `technical-backup-${job.fallbackProviderId}-fallback-${safeDate}.sql.gz`;
      }

      return `technical-backup-${safeDate}.sql.gz`;
    }

    return `backup-${safeDate}.zip`;
  }

  private async processFunctionalBackupJob(backupJobId: string) {
    const existingJob = await this.backupsRepository.findById(backupJobId);

    if (!existingJob) {
      throw new NotFoundException('Backup job nao encontrado.');
    }

    if (existingJob.status === 'success') {
      this.logger.warn(`Job ${backupJobId} ja foi processado com sucesso.`);
      return;
    }

    if (!existingJob.scopeUserId) {
      throw new BadRequestException(
        `Backup funcional ${backupJobId} sem scopeUserId.`,
      );
    }

    await this.backupsRepository.markRunning(backupJobId);

    try {
      const archive = await this.functionalBackupArchiveService.buildArchive(
        existingJob.scopeUserId,
      );
      const storageKey = this.buildFunctionalStorageKey(
        existingJob.scopeUserId,
        existingJob.trigger,
        existingJob.id,
        archive.manifest.createdAt,
      );

      await this.storageProvider.uploadPrivate(
        {
          buffer: archive.archiveBuffer,
          mimetype: 'application/zip',
          originalname: this.buildDownloadFileName({
            createdAt: archive.manifest.createdAt,
          }),
        },
        storageKey,
      );

      await this.backupsRepository.markSuccess(backupJobId, {
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

      await this.backupRetentionService.pruneFunctionalBackups(
        existingJob.scopeUserId,
        this.retentionCount,
      );
    } catch (error) {
      this.logOperationalError('processFunctionalBackupJob', error, {
        backupJobId,
        scopeUserId: existingJob.scopeUserId,
      });
      await this.backupsRepository.markFailed(
        backupJobId,
        getBackupPublicErrorMessage('processFunctionalJob'),
      );
      throw error;
    }
  }

  private async uploadTechnicalBackup(
    existingJob: BackupJobRecord,
    technicalDump: {
      dumpBuffer: Buffer;
      contentType: string;
      rawSizeBytes: number;
    },
  ): Promise<TechnicalBackupUploadOutcome> {
    const primaryProvider = this.backupStorageRegistry.getActiveProvider();
    const primaryStorageKey = this.buildTechnicalStorageKey(
      existingJob.trigger,
      existingJob.id,
    );
    const primaryFileName = this.buildDownloadFileName({
      kind: TECHNICAL_BACKUP_KIND,
      createdAt: existingJob.createdAt,
    });

    this.logger.log({
      context: 'processTechnicalBackupJob:providerAttempt',
      backupJobId: existingJob.id,
      requestedProviderId: primaryProvider.id,
      attemptProviderId: primaryProvider.id,
      storageKey: primaryStorageKey,
      storageFileName: primaryFileName,
      trigger: existingJob.trigger,
    });

    try {
      const upload = await primaryProvider.upload(
        {
          buffer: technicalDump.dumpBuffer,
          contentType: technicalDump.contentType,
          fileName: primaryFileName,
        },
        primaryStorageKey,
      );

      return {
        requestedProviderId: primaryProvider.id,
        providerId: upload.providerId,
        reference: upload,
        fallbackUsed: false,
        fallbackFromProviderId: null,
        fallbackReason: null,
        uploadAttemptCount: 1,
      };
    } catch (error) {
      this.logger.error(
        {
          context: 'processTechnicalBackupJob:providerFailed',
          backupJobId: existingJob.id,
          requestedProviderId: primaryProvider.id,
          attemptProviderId: primaryProvider.id,
          storageKey: primaryStorageKey,
          storageFileName: primaryFileName,
          trigger: existingJob.trigger,
          message: this.getErrorMessage(error),
        },
        error instanceof Error ? error.stack : undefined,
      );

      if (!this.shouldAttemptTechnicalUploadFallback(primaryProvider.id, error)) {
        throw error;
      }

      const fallbackProviderId = this.getConfiguredFallbackProviderId(
        primaryProvider.id,
      );

      if (!fallbackProviderId) {
        throw error;
      }

      const fallbackProvider =
        this.backupStorageRegistry.getProvider(fallbackProviderId);
      const fallbackStorageKey = this.buildTechnicalStorageKey(
        existingJob.trigger,
        existingJob.id,
        {
          fallbackProviderId,
        },
      );
      const fallbackFileName = this.buildDownloadFileName({
        kind: TECHNICAL_BACKUP_KIND,
        createdAt: existingJob.createdAt,
        fallbackProviderId,
      });

      this.logger.log({
        context: 'processTechnicalBackupJob:fallbackAttempt',
        backupJobId: existingJob.id,
        requestedProviderId: primaryProvider.id,
        attemptProviderId: fallbackProvider.id,
        fallbackProviderId,
        storageKey: fallbackStorageKey,
        storageFileName: fallbackFileName,
        trigger: existingJob.trigger,
        message: this.getErrorMessage(error),
      });

      try {
        const fallbackUpload = await fallbackProvider.upload(
          {
            buffer: technicalDump.dumpBuffer,
            contentType: technicalDump.contentType,
            fileName: fallbackFileName,
          },
          fallbackStorageKey,
        );

        this.logger.log({
          context: 'processTechnicalBackupJob:fallbackSuccess',
          backupJobId: existingJob.id,
          requestedProviderId: primaryProvider.id,
          fallbackProviderId,
          storageKey: fallbackUpload.key,
          storageFileName: fallbackUpload.fileName,
          trigger: existingJob.trigger,
        });

        return {
          requestedProviderId: primaryProvider.id,
          providerId: fallbackUpload.providerId,
          reference: fallbackUpload,
          fallbackUsed: true,
          fallbackFromProviderId: primaryProvider.id,
          fallbackReason: this.getErrorMessage(error),
          uploadAttemptCount: 2,
        };
      } catch (fallbackError) {
        this.logger.error(
          {
            context: 'processTechnicalBackupJob:fallbackFailed',
            backupJobId: existingJob.id,
            requestedProviderId: primaryProvider.id,
            attemptProviderId: fallbackProvider.id,
            fallbackProviderId,
            storageKey: fallbackStorageKey,
            storageFileName: fallbackFileName,
            trigger: existingJob.trigger,
            message: this.getErrorMessage(fallbackError),
          },
          fallbackError instanceof Error ? fallbackError.stack : undefined,
        );
        throw fallbackError;
      }
    }
  }

  private async processTechnicalBackupJob(backupJobId: string) {
    const existingJob = await this.backupsRepository.findById(backupJobId);

    if (!existingJob) {
      throw new NotFoundException('Backup tecnico nao encontrado.');
    }

    await this.backupsRepository.markRunning(backupJobId);

    try {
      const requestedProvider = this.backupStorageRegistry.getActiveProvider();
      this.logger.log({
        context: 'processTechnicalBackupJob:start',
        backupJobId,
        providerId: requestedProvider.id,
        trigger: existingJob.trigger,
      });
      const technicalDump =
        await this.technicalBackupRunnerService.createDumpBuffer();
      const upload = await this.uploadTechnicalBackup(existingJob, technicalDump);

      await this.backupsRepository.markSuccess(backupJobId, {
        storageKey: upload.reference.key,
        checksum: this.getSha256(technicalDump.dumpBuffer),
        sizeBytes: technicalDump.dumpBuffer.length,
        metadataJson: JSON.stringify({
          compression: 'gzip',
          rawSizeBytes: technicalDump.rawSizeBytes,
          requestedStorageProviderId: upload.requestedProviderId,
          storageProviderId: upload.providerId,
          storageFileName: upload.reference.fileName,
          displayFileName: upload.reference.fileName,
          storageContentType: upload.reference.contentType,
          fallbackUsed: upload.fallbackUsed,
          fallbackFromProviderId: upload.fallbackFromProviderId,
          fallbackReason: upload.fallbackReason,
          uploadAttemptCount: upload.uploadAttemptCount,
        }),
      });

      const settings = await this.systemBackupSettingsService.getSettings();
      await this.systemBackupRetentionService.pruneBackups(
        settings.retention.mode === 'count'
          ? {
              mode: 'count',
              maxCount: settings.retention.maxCount ?? this.technicalRetentionCount,
            }
          : {
              mode: 'max_age',
              maxAgeDays: settings.retention.maxAgeDays ?? 30,
            },
      );

      this.logger.log({
        context: 'processTechnicalBackupJob:success',
        backupJobId,
        requestedProviderId: upload.requestedProviderId,
        providerId: upload.providerId,
        fallbackUsed: upload.fallbackUsed,
        storageKey: upload.reference.key,
        storageFileName: upload.reference.fileName,
        sizeBytes: technicalDump.dumpBuffer.length,
      });
    } catch (error) {
      this.logOperationalError('processTechnicalBackupJob', error, {
        backupJobId,
      });
      await this.backupsRepository.markFailed(
        backupJobId,
        this.getTechnicalBackupFailureMessage(error),
      );
      throw error;
    }
  }

  private getSha256(buffer: Buffer) {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async enqueueScheduledFunctionalBackups() {
    const users = await this.usersService.findAll();

    for (const user of users) {
      const job = await this.backupsRepository.createScheduledFunctionalJob(
        user.id,
      );

      await this.enqueueBackupJob(
        GENERATE_FUNCTIONAL_BACKUP_JOB,
        { backupJobId: job.id },
        { scopeUserId: user.id, backupJobId: job.id, trigger: 'scheduled' },
      );
    }
  }

  private async enqueueScheduledTechnicalBackup() {
    this.logger.log({
      context: 'enqueueScheduledTechnicalBackup:start',
    });

    const job = await this.backupsRepository.createTechnicalJob(
      SCHEDULED_BACKUP_TRIGGER,
      null,
    );

    await this.enqueueBackupJob(
      GENERATE_TECHNICAL_BACKUP_JOB,
      { backupJobId: job.id },
      { backupJobId: job.id, trigger: 'scheduled' },
    );

    this.logger.log({
      context: 'enqueueScheduledTechnicalBackup:success',
      backupJobId: job.id,
    });
  }
}
