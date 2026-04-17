import { Injectable, Logger } from '@nestjs/common';
import type { BackupJobRecord } from '../backups.repository';
import { BackupsRepository } from '../backups.repository';
import type { BackupStorageReference } from '../interfaces/backup-storage-provider.interface';
import { BackupStorageRegistryService } from './backup-storage-registry.service';

interface CountRetentionPolicy {
  mode: 'count';
  maxCount: number;
}

interface MaxAgeRetentionPolicy {
  mode: 'max_age';
  maxAgeDays: number;
}

export type SystemBackupRetentionPolicy =
  | CountRetentionPolicy
  | MaxAgeRetentionPolicy;

@Injectable()
export class SystemBackupRetentionService {
  private readonly logger = new Logger(SystemBackupRetentionService.name);

  constructor(
    private readonly backupsRepository: BackupsRepository,
    private readonly backupStorageRegistry: BackupStorageRegistryService,
  ) {}

  async pruneBackups(policy: SystemBackupRetentionPolicy) {
    const successfulJobs =
      await this.backupsRepository.listSuccessfulTechnicalJobs();

    const jobsToDelete =
      policy.mode === 'count'
        ? successfulJobs.slice(policy.maxCount)
        : successfulJobs.filter((job) => this.isOlderThanMaxAge(job, policy));

    for (const job of jobsToDelete) {
      await this.deleteBackupObject(job);
    }
  }

  private isOlderThanMaxAge(
    job: BackupJobRecord,
    policy: MaxAgeRetentionPolicy,
  ) {
    const createdAt =
      job.createdAt instanceof Date
        ? job.createdAt
        : new Date(String(job.createdAt));
    const threshold = Date.now() - policy.maxAgeDays * 24 * 60 * 60 * 1000;

    return createdAt.getTime() < threshold;
  }

  private getStorageReference(job: BackupJobRecord): BackupStorageReference | null {
    if (!job.storageKey) {
      return null;
    }

    const metadata = this.safeParseMetadata(job.metadataJson);
    const providerId =
      typeof metadata?.storageProviderId === 'string'
        ? metadata.storageProviderId
        : 'r2';
    const fileName =
      typeof metadata?.storageFileName === 'string'
        ? metadata.storageFileName
        : job.storageKey.split('/').pop() ?? `${job.id}.sql.gz`;
    const contentType =
      typeof metadata?.storageContentType === 'string'
        ? metadata.storageContentType
        : 'application/gzip';

    return {
      providerId,
      key: job.storageKey,
      fileName,
      contentType,
    };
  }

  private safeParseMetadata(metadataJson?: string | null) {
    if (!metadataJson) {
      return null;
    }

    try {
      return JSON.parse(metadataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private async deleteBackupObject(job: BackupJobRecord) {
    const reference = this.getStorageReference(job);

    if (!reference) {
      await this.backupsRepository.delete(job.id);
      return;
    }

    try {
      await this.backupStorageRegistry
        .getProvider(reference.providerId)
        .delete(reference);
      await this.backupsRepository.delete(job.id);
    } catch (error) {
      this.logger.error(
        `Falha ao aplicar retencao do backup técnico ${job.id}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }
}
