/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { STORAGE_PROVIDER } from '../../storage/interfaces/storage-provider.interface';
import type { IStorageProvider } from '../../storage/interfaces/storage-provider.interface';
import { BackupsRepository } from '../backups.repository';
import {
  DEFAULT_BACKUP_STORAGE_PREFIX,
} from '../backups.constants';
import { getBackupPublicErrorMessage } from '../backups-public-errors';
import { FunctionalBackupArchiveService } from './functional-backup-archive.service';
import type { BackupImportUploadSource } from '../utils/backup-import-upload.util';
import { ZipArchiveValidationError } from '../utils/zip-reader.util';
import { FunctionalBackupImportArchiveParserService } from './functional-backup-import-archive-parser.service';
import { FunctionalBackupImportDatasetValidatorService } from './functional-backup-import-dataset-validator.service';
import { FunctionalBackupImportExecutorService } from './functional-backup-import-executor.service';
import { FunctionalBackupImportPreviewUploadCoordinatorService } from './functional-backup-import-preview-upload-coordinator.service';
import type {
  FunctionalBackupImportJobPhase,
  FunctionalBackupImportJobResponse,
  FunctionalBackupImportJobStatus,
  FunctionalBackupImportPreview,
  ParsedFunctionalBackupArchive,
} from './functional-backup-import.types';

class BackupArchiveValidationException extends BadRequestException {}

@Injectable()
export class FunctionalBackupImportService {
  private readonly logger = new Logger(FunctionalBackupImportService.name);
  private readonly storagePrefix: string;

  constructor(
    private readonly backupsRepository: BackupsRepository,
    private readonly configService: ConfigService,
    private readonly archiveParser: FunctionalBackupImportArchiveParserService,
    private readonly datasetValidator: FunctionalBackupImportDatasetValidatorService,
    private readonly importExecutor: FunctionalBackupImportExecutorService,
    private readonly previewUploadCoordinator: FunctionalBackupImportPreviewUploadCoordinatorService,
    private readonly functionalBackupArchiveService: FunctionalBackupArchiveService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {
    this.storagePrefix =
      this.configService.get<string>('BACKUP_STORAGE_PREFIX') ??
      DEFAULT_BACKUP_STORAGE_PREFIX;
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

  private isArchiveValidationException(
    error: unknown,
  ): error is BackupArchiveValidationException {
    return error instanceof BackupArchiveValidationException;
  }

  private toArchiveValidationException(error: unknown) {
    if (this.isArchiveValidationException(error)) {
      return error;
    }

    return new BackupArchiveValidationException(this.getErrorMessage(error));
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

  private toParsedArchiveValidationException(error: unknown) {
    if (
      error instanceof BadRequestException ||
      error instanceof ZipArchiveValidationError
    ) {
      return this.toArchiveValidationException(error);
    }

    return null;
  }

  private async cleanupUploadedArchive(
    storageKey: string,
    metadata?: Record<string, unknown>,
    shouldCleanup = true,
  ) {
    if (!shouldCleanup) {
      return;
    }

    try {
      await this.previewUploadCoordinator.cleanupUploadedArchive(storageKey);
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
    let parsedArchive: ParsedFunctionalBackupArchive | null = null;

    try {
      parsedArchive = await this.previewUploadCoordinator.uploadAndParseArchive(
        upload,
        storageKey,
        {
          contentDisposition: `attachment; filename="${importJobId}.zip"`,
          fallbackOriginalName: `${importJobId}.zip`,
        },
      );
      const previewPayload = this.datasetValidator.buildPreview(
        parsedArchive.dataset,
        parsedArchive,
      );
      const importJob = await this.backupsRepository.createImportJob({
        id: importJobId,
        scopeUserId: userId,
        actorUserId: userId,
        uploadedStorageKey: storageKey,
        archiveChecksum: parsedArchive.archiveChecksum,
        sizeBytes: parsedArchive.sizeBytes,
        manifestVersion: previewPayload.manifestVersion,
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
      await this.cleanupUploadedArchive(storageKey, {
        importJobId,
        originalname: upload.originalname,
        userId,
      }, parsedArchive !== null);
      const validationError = this.toParsedArchiveValidationException(error);

      if (validationError) {
        this.logArchiveRejection(
          'previewImport.rejectedArchive',
          userId,
          upload.originalname,
          validationError,
        );
        throw validationError;
      }

      this.logOperationalError('previewImport.streamingPipeline', error, {
        importJobId,
        originalname: upload.originalname,
        storageKey,
        userId,
      });
      throw new ServiceUnavailableException(
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
      const parsedArchive = await this.archiveParser.parseArchiveSource(
        archiveStream as AsyncIterable<Buffer | Uint8Array | string>,
      );

      if (
        parsedArchive.archiveChecksum !== importJob.archiveChecksum ||
        parsedArchive.sizeBytes !== importJob.sizeBytes
      ) {
        throw new BadRequestException(
          'O arquivo desta importacao nao corresponde ao preview validado.',
        );
      }

      const preview = this.datasetValidator.buildPreview(
        parsedArchive.dataset,
        parsedArchive,
      );

      await this.createPreImportBackup(userId, userId);
      await this.backupsRepository.updateImportPhase(importJob.id, 'importing');
      await this.importExecutor.execute(userId, parsedArchive.dataset);
      await this.backupsRepository.markImportSuccess(
        importJob.id,
        JSON.stringify(preview),
      );

      return this.getImportStatus(userId, importJob.id);
    } catch (error) {
      const validationError = this.toParsedArchiveValidationException(error);

      if (validationError) {
        this.logArchiveRejection(
          'executeImport.rejectedArchive',
          userId,
          importJob.uploadedStorageKey?.split('/').pop(),
          validationError,
        );
        await this.backupsRepository.markImportFailed(
          importJob.id,
          this.getErrorMessage(validationError),
        );
        throw validationError;
      }

      this.logOperationalError('executeImport', error, {
        importJobId: importJob.id,
        userId,
      });
      await this.backupsRepository.markImportFailed(
        importJob.id,
        getBackupPublicErrorMessage('executeImport'),
      );
      throw new ServiceUnavailableException(
        getBackupPublicErrorMessage('executeImport'),
      );
    }
  }
}
