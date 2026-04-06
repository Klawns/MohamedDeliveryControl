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
import { UsersService } from '../users/users.service';
import { STORAGE_PROVIDER } from '../storage/interfaces/storage-provider.interface';
import type { IStorageProvider } from '../storage/interfaces/storage-provider.interface';
import { BackupsRepository } from './backups.repository';
import type { BackupJobRecord } from './backups.repository';
import { BackupsAutomationService } from './backups-automation.service';
import { FunctionalBackupArchiveService } from './services/functional-backup-archive.service';
import { FunctionalBackupImportService } from './services/functional-backup-import.service';
import { TechnicalBackupRunnerService } from './services/technical-backup-runner.service';
import type { BackupImportUploadSource } from './utils/backup-import-upload.util';
import {
  BACKUPS_QUEUE,
  DEFAULT_BACKUP_HISTORY_LIMIT,
  DEFAULT_BACKUP_RETENTION_COUNT,
  DEFAULT_BACKUP_QUEUE_ENQUEUE_TIMEOUT_MS,
  DEFAULT_BACKUP_SIGNED_URL_TTL_SECONDS,
  DEFAULT_BACKUP_STORAGE_PREFIX,
  DEFAULT_TECHNICAL_BACKUP_RETENTION_COUNT,
  GENERATE_FUNCTIONAL_BACKUP_JOB,
  GENERATE_TECHNICAL_BACKUP_JOB,
  MANUAL_BACKUP_TRIGGER,
  RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
  RUN_TECHNICAL_BACKUP_SCHEDULE_JOB,
  SCHEDULED_BACKUP_TRIGGER,
  TECHNICAL_BACKUP_KIND,
} from './backups.constants';
import { getBackupPublicErrorMessage } from './backups-public-errors';

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly retentionCount: number;
  private readonly technicalRetentionCount: number;
  private readonly historyLimit: number;
  private readonly signedUrlTtlSeconds: number;
  private readonly storagePrefix: string;
  private readonly queueEnqueueTimeoutMs: number;

  constructor(
    private readonly backupsRepository: BackupsRepository,
    private readonly backupsAutomationService: BackupsAutomationService,
    private readonly functionalBackupArchiveService: FunctionalBackupArchiveService,
    private readonly functionalBackupImportService: FunctionalBackupImportService,
    private readonly technicalBackupRunnerService: TechnicalBackupRunnerService,
    private readonly usersService: UsersService,
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
    this.historyLimit = this.configService.get<number>(
      'BACKUP_HISTORY_LIMIT',
      DEFAULT_BACKUP_HISTORY_LIMIT,
    );
    this.signedUrlTtlSeconds = this.configService.get<number>(
      'BACKUP_SIGNED_URL_TTL_SECONDS',
      DEFAULT_BACKUP_SIGNED_URL_TTL_SECONDS,
    );
    this.storagePrefix =
      this.configService.get<string>('BACKUP_STORAGE_PREFIX') ??
      DEFAULT_BACKUP_STORAGE_PREFIX;
    this.queueEnqueueTimeoutMs = this.configService.get<number>(
      'BACKUP_QUEUE_ENQUEUE_TIMEOUT_MS',
      DEFAULT_BACKUP_QUEUE_ENQUEUE_TIMEOUT_MS,
    );
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

  private toResponse(job: BackupJobRecord) {
    const publicErrorMessage =
      job.status === 'failed'
        ? job.kind === TECHNICAL_BACKUP_KIND
          ? getBackupPublicErrorMessage('processTechnicalJob')
          : getBackupPublicErrorMessage('processFunctionalJob')
        : null;

    return {
      id: job.id,
      kind: job.kind,
      trigger: job.trigger,
      status: job.status,
      checksum: job.checksum ?? null,
      sizeBytes: job.sizeBytes ?? null,
      manifestVersion: job.manifestVersion,
      errorMessage: publicErrorMessage,
      createdAt: job.createdAt,
      startedAt: job.startedAt ?? null,
      finishedAt: job.finishedAt ?? null,
      metadata: this.safeParseMetadata(job.metadataJson),
    };
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

  private buildTechnicalStorageKey(trigger: string, jobId: string) {
    const dateSegment = new Date().toISOString().slice(0, 10);
    return `${this.storagePrefix}/technical/${trigger}/${dateSegment}/${jobId}.sql.gz`;
  }

  private buildDownloadFileName(job: {
    kind?: BackupJobRecord['kind'];
    createdAt: Date | string;
    trigger?: BackupJobRecord['trigger'];
  }) {
    const createdAt =
      job.createdAt instanceof Date
        ? job.createdAt.toISOString()
        : String(job.createdAt);
    const safeDate = createdAt.replace(/[:.]/g, '-');

    if (job.kind === TECHNICAL_BACKUP_KIND) {
      return `technical-backup-${safeDate}.sql.gz`;
    }

    return `backup-${safeDate}.zip`;
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

    return this.toResponse(job);
  }

  async createManualTechnicalBackup(actorUserId: string) {
    let job: BackupJobRecord | undefined;

    try {
      job = await this.backupsRepository.createTechnicalJob(
        MANUAL_BACKUP_TRIGGER,
        actorUserId,
      );

      await this.enqueueBackupJob(
        GENERATE_TECHNICAL_BACKUP_JOB,
        { backupJobId: job.id },
        { actorUserId, backupJobId: job.id },
      );
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

    return this.toResponse(job);
  }

  async listUserBackups(userId: string) {
    const jobs = await this.backupsRepository.listUserJobs(
      userId,
      this.historyLimit,
    );
    return jobs.map((job) => this.toResponse(job));
  }

  async listTechnicalBackups() {
    try {
      const jobs = await this.backupsRepository.listTechnicalJobs(
        this.historyLimit,
      );
      return jobs.map((job) => this.toResponse(job));
    } catch (error) {
      if (this.isTechnicalBackupSchemaError(error)) {
        throw this.getTechnicalBackupUnavailableException();
      }

      throw error;
    }
  }

  getUserBackupStatus() {
    const automation = this.backupsAutomationService.getStatus();

    return {
      automation,
      historyLimit: this.historyLimit,
      retentionCount: this.retentionCount,
    };
  }

  async getDownloadUrl(userId: string, id: string) {
    const job = await this.backupsRepository.findUserJob(userId, id);

    if (!job) {
      throw new NotFoundException('Backup nao encontrado.');
    }

    return this.buildSignedDownloadResponse(job);
  }

  async getTechnicalDownloadUrl(id: string) {
    let job;

    try {
      job = await this.backupsRepository.findTechnicalJob(id);
    } catch (error) {
      if (this.isTechnicalBackupSchemaError(error)) {
        throw this.getTechnicalBackupUnavailableException();
      }

      throw error;
    }

    if (!job) {
      throw new NotFoundException('Backup tecnico nao encontrado.');
    }

    return this.buildSignedDownloadResponse(job);
  }

  private async buildSignedDownloadResponse(job: BackupJobRecord) {
    if (job.status !== 'success' || !job.storageKey) {
      throw new BadRequestException(
        'O backup ainda nao esta disponivel para download.',
      );
    }

    const url = await this.storageProvider.getSignedUrl(job.storageKey, {
      expiresInSeconds: this.signedUrlTtlSeconds,
      downloadName: this.buildDownloadFileName(job),
      visibility: 'private',
    });

    return {
      id: job.id,
      url,
      expiresInSeconds: this.signedUrlTtlSeconds,
    };
  }

  previewFunctionalImport(userId: string, upload: BackupImportUploadSource) {
    return this.functionalBackupImportService.previewImport(userId, upload);
  }

  getFunctionalImportStatus(userId: string, importJobId: string) {
    return this.functionalBackupImportService.getImportStatus(
      userId,
      importJobId,
    );
  }

  executeFunctionalImport(userId: string, importJobId: string) {
    return this.functionalBackupImportService.executeImport(
      userId,
      importJobId,
    );
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

      await this.pruneFunctionalBackups(existingJob.scopeUserId);
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

  private async processTechnicalBackupJob(backupJobId: string) {
    const existingJob = await this.backupsRepository.findById(backupJobId);

    if (!existingJob) {
      throw new NotFoundException('Backup tecnico nao encontrado.');
    }

    await this.backupsRepository.markRunning(backupJobId);

    try {
      const technicalDump =
        await this.technicalBackupRunnerService.createDumpBuffer();
      const storageKey = this.buildTechnicalStorageKey(
        existingJob.trigger,
        existingJob.id,
      );

      await this.storageProvider.uploadPrivate(
        {
          buffer: technicalDump.dumpBuffer,
          mimetype: technicalDump.contentType,
          originalname: this.buildDownloadFileName({
            kind: TECHNICAL_BACKUP_KIND,
            createdAt: existingJob.createdAt,
          }),
        },
        storageKey,
      );

      await this.backupsRepository.markSuccess(backupJobId, {
        storageKey,
        checksum: this.getSha256(technicalDump.dumpBuffer),
        sizeBytes: technicalDump.dumpBuffer.length,
        metadataJson: JSON.stringify({
          compression: 'gzip',
          rawSizeBytes: technicalDump.rawSizeBytes,
        }),
      });

      await this.pruneTechnicalBackups();
    } catch (error) {
      this.logOperationalError('processTechnicalBackupJob', error, {
        backupJobId,
      });
      await this.backupsRepository.markFailed(
        backupJobId,
        getBackupPublicErrorMessage('processTechnicalJob'),
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
    const job = await this.backupsRepository.createTechnicalJob(
      SCHEDULED_BACKUP_TRIGGER,
      null,
    );

    await this.enqueueBackupJob(
      GENERATE_TECHNICAL_BACKUP_JOB,
      { backupJobId: job.id },
      { backupJobId: job.id, trigger: 'scheduled' },
    );
  }

  private async pruneFunctionalBackups(userId: string) {
    const successfulJobs =
      await this.backupsRepository.listSuccessfulFunctionalJobs(userId);
    const jobsToDelete = successfulJobs.slice(this.retentionCount);

    for (const job of jobsToDelete) {
      await this.deleteBackupObject(job);
    }
  }

  private async pruneTechnicalBackups() {
    const successfulJobs =
      await this.backupsRepository.listSuccessfulTechnicalJobs();
    const jobsToDelete = successfulJobs.slice(this.technicalRetentionCount);

    for (const job of jobsToDelete) {
      await this.deleteBackupObject(job);
    }
  }

  private async deleteBackupObject(job: BackupJobRecord) {
    if (!job.storageKey) {
      await this.backupsRepository.delete(job.id);
      return;
    }

    try {
      await this.storageProvider.delete(job.storageKey, {
        visibility: 'private',
      });
      await this.backupsRepository.delete(job.id);
    } catch (error) {
      this.logger.error(
        `Falha ao aplicar retencao do backup ${job.id}: ${this.getErrorMessage(error)}`,
      );
    }
  }
}
