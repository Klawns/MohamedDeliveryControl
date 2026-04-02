/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Inject, Injectable } from '@nestjs/common';
import {
  backupImportJobs,
  backupJobs,
  type InferSelectModel,
} from '@mdc/database';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleClient } from '../database/database.provider';
import {
  BACKUP_MANIFEST_VERSION,
  FUNCTIONAL_BACKUP_KIND,
  MANUAL_BACKUP_TRIGGER,
  PRE_IMPORT_BACKUP_KIND,
  PRE_IMPORT_BACKUP_TRIGGER,
  SCHEDULED_BACKUP_TRIGGER,
  TECHNICAL_BACKUP_KIND,
} from './backups.constants';

type BackupTrigger =
  | typeof MANUAL_BACKUP_TRIGGER
  | typeof SCHEDULED_BACKUP_TRIGGER
  | typeof PRE_IMPORT_BACKUP_TRIGGER;

type BackupKind =
  | typeof FUNCTIONAL_BACKUP_KIND
  | typeof TECHNICAL_BACKUP_KIND
  | typeof PRE_IMPORT_BACKUP_KIND;

type BackupImportPhase =
  | 'validated'
  | 'backing_up'
  | 'importing'
  | 'completed'
  | 'failed';

export type BackupJobRecord = InferSelectModel<typeof backupJobs>;
export type BackupImportJobRecord = InferSelectModel<typeof backupImportJobs>;

@Injectable()
export class BackupsRepository {
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

  async createBackupJob(input: {
    kind: BackupKind;
    trigger: BackupTrigger;
    scopeUserId?: string | null;
    actorUserId?: string | null;
  }): Promise<BackupJobRecord> {
    const [job] = (await this.db
      .insert(this.schema.backupJobs)
      .values({
        id: randomUUID(),
        kind: input.kind,
        trigger: input.trigger,
        scopeUserId: input.scopeUserId ?? null,
        actorUserId: input.actorUserId ?? null,
        status: 'pending',
        manifestVersion: BACKUP_MANIFEST_VERSION,
      })
      .returning()) as BackupJobRecord[];

    return job;
  }

  createManualFunctionalJob(userId: string): Promise<BackupJobRecord> {
    return this.createBackupJob({
      kind: FUNCTIONAL_BACKUP_KIND,
      trigger: MANUAL_BACKUP_TRIGGER,
      scopeUserId: userId,
      actorUserId: userId,
    });
  }

  createScheduledFunctionalJob(userId: string): Promise<BackupJobRecord> {
    return this.createBackupJob({
      kind: FUNCTIONAL_BACKUP_KIND,
      trigger: SCHEDULED_BACKUP_TRIGGER,
      scopeUserId: userId,
      actorUserId: userId,
    });
  }

  createPreImportJob(
    userId: string,
    actorUserId: string,
  ): Promise<BackupJobRecord> {
    return this.createBackupJob({
      kind: PRE_IMPORT_BACKUP_KIND,
      trigger: PRE_IMPORT_BACKUP_TRIGGER,
      scopeUserId: userId,
      actorUserId,
    });
  }

  createTechnicalJob(
    trigger: BackupTrigger,
    actorUserId?: string | null,
  ): Promise<BackupJobRecord> {
    return this.createBackupJob({
      kind: TECHNICAL_BACKUP_KIND,
      trigger,
      scopeUserId: null,
      actorUserId: actorUserId ?? null,
    });
  }

  async createImportJob(input: {
    id?: string;
    scopeUserId: string;
    actorUserId: string;
    uploadedStorageKey: string;
    archiveChecksum: string;
    sizeBytes: number;
    manifestVersion: number;
    previewJson: string;
  }): Promise<BackupImportJobRecord> {
    const [job] = (await this.db
      .insert(this.schema.backupImportJobs)
      .values({
        id: input.id ?? randomUUID(),
        scopeUserId: input.scopeUserId,
        actorUserId: input.actorUserId,
        status: 'validated',
        phase: 'validated',
        uploadedStorageKey: input.uploadedStorageKey,
        archiveChecksum: input.archiveChecksum,
        sizeBytes: input.sizeBytes,
        manifestVersion: input.manifestVersion,
        previewJson: input.previewJson,
      })
      .returning()) as BackupImportJobRecord[];

    return job;
  }

  async findById(id: string): Promise<BackupJobRecord | undefined> {
    const [job] = (await this.db
      .select()
      .from(this.schema.backupJobs)
      .where(eq(this.schema.backupJobs.id, id))
      .limit(1)) as BackupJobRecord[];

    return job;
  }

  async findUserJob(
    userId: string,
    id: string,
  ): Promise<BackupJobRecord | undefined> {
    const [job] = (await this.db
      .select()
      .from(this.schema.backupJobs)
      .where(
        and(
          eq(this.schema.backupJobs.id, id),
          eq(this.schema.backupJobs.scopeUserId, userId),
          inArray(this.schema.backupJobs.kind, [
            FUNCTIONAL_BACKUP_KIND,
            PRE_IMPORT_BACKUP_KIND,
          ]),
        ),
      )
      .limit(1)) as BackupJobRecord[];

    return job;
  }

  async findTechnicalJob(id: string): Promise<BackupJobRecord | undefined> {
    const [job] = (await this.db
      .select()
      .from(this.schema.backupJobs)
      .where(
        and(
          eq(this.schema.backupJobs.id, id),
          eq(this.schema.backupJobs.kind, TECHNICAL_BACKUP_KIND),
        ),
      )
      .limit(1)) as BackupJobRecord[];

    return job;
  }

  listUserJobs(
    userId: string,
    maxResults?: number,
  ): Promise<BackupJobRecord[]> {
    const query = this.db
      .select()
      .from(this.schema.backupJobs)
      .where(
        and(
          eq(this.schema.backupJobs.scopeUserId, userId),
          inArray(this.schema.backupJobs.kind, [
            FUNCTIONAL_BACKUP_KIND,
            PRE_IMPORT_BACKUP_KIND,
          ]),
        ),
      )
      .orderBy(desc(this.schema.backupJobs.createdAt));

    if (typeof maxResults === 'number' && maxResults > 0) {
      return query.limit(maxResults) as Promise<BackupJobRecord[]>;
    }

    return query as Promise<BackupJobRecord[]>;
  }

  listTechnicalJobs(maxResults?: number): Promise<BackupJobRecord[]> {
    const query = this.db
      .select()
      .from(this.schema.backupJobs)
      .where(eq(this.schema.backupJobs.kind, TECHNICAL_BACKUP_KIND))
      .orderBy(desc(this.schema.backupJobs.createdAt));

    if (typeof maxResults === 'number' && maxResults > 0) {
      return query.limit(maxResults) as Promise<BackupJobRecord[]>;
    }

    return query as Promise<BackupJobRecord[]>;
  }

  listSuccessfulFunctionalJobs(userId: string): Promise<BackupJobRecord[]> {
    return this.db
      .select()
      .from(this.schema.backupJobs)
      .where(
        and(
          eq(this.schema.backupJobs.scopeUserId, userId),
          eq(this.schema.backupJobs.kind, FUNCTIONAL_BACKUP_KIND),
          eq(this.schema.backupJobs.status, 'success'),
        ),
      )
      .orderBy(desc(this.schema.backupJobs.createdAt)) as Promise<
      BackupJobRecord[]
    >;
  }

  listSuccessfulTechnicalJobs(): Promise<BackupJobRecord[]> {
    return this.db
      .select()
      .from(this.schema.backupJobs)
      .where(
        and(
          eq(this.schema.backupJobs.kind, TECHNICAL_BACKUP_KIND),
          eq(this.schema.backupJobs.status, 'success'),
        ),
      )
      .orderBy(desc(this.schema.backupJobs.createdAt)) as Promise<
      BackupJobRecord[]
    >;
  }

  async findImportJob(
    userId: string,
    id: string,
  ): Promise<BackupImportJobRecord | undefined> {
    const [job] = (await this.db
      .select()
      .from(this.schema.backupImportJobs)
      .where(
        and(
          eq(this.schema.backupImportJobs.id, id),
          eq(this.schema.backupImportJobs.scopeUserId, userId),
        ),
      )
      .limit(1)) as BackupImportJobRecord[];

    return job;
  }

  async markRunning(id: string): Promise<BackupJobRecord> {
    const [job] = (await this.db
      .update(this.schema.backupJobs)
      .set({
        status: 'running',
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      })
      .where(eq(this.schema.backupJobs.id, id))
      .returning()) as BackupJobRecord[];

    return job;
  }

  async markSuccess(
    id: string,
    data: {
      storageKey: string;
      checksum: string;
      sizeBytes: number;
      metadataJson: string;
    },
  ): Promise<BackupJobRecord> {
    const [job] = (await this.db
      .update(this.schema.backupJobs)
      .set({
        status: 'success',
        storageKey: data.storageKey,
        checksum: data.checksum,
        sizeBytes: data.sizeBytes,
        metadataJson: data.metadataJson,
        finishedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(this.schema.backupJobs.id, id))
      .returning()) as BackupJobRecord[];

    return job;
  }

  async markFailed(id: string, errorMessage: string): Promise<BackupJobRecord> {
    const [job] = (await this.db
      .update(this.schema.backupJobs)
      .set({
        status: 'failed',
        errorMessage,
        finishedAt: new Date(),
      })
      .where(eq(this.schema.backupJobs.id, id))
      .returning()) as BackupJobRecord[];

    return job;
  }

  async markImportRunning(
    id: string,
    phase: BackupImportPhase = 'backing_up',
  ): Promise<BackupImportJobRecord> {
    const [job] = (await this.db
      .update(this.schema.backupImportJobs)
      .set({
        status: 'running',
        phase,
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning()) as BackupImportJobRecord[];

    return job;
  }

  async updateImportPhase(
    id: string,
    phase: BackupImportPhase,
  ): Promise<BackupImportJobRecord> {
    const [job] = (await this.db
      .update(this.schema.backupImportJobs)
      .set({
        phase,
        errorMessage: null,
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning()) as BackupImportJobRecord[];

    return job;
  }

  async markImportSuccess(
    id: string,
    previewJson: string,
  ): Promise<BackupImportJobRecord> {
    const [job] = (await this.db
      .update(this.schema.backupImportJobs)
      .set({
        status: 'success',
        phase: 'completed',
        previewJson,
        finishedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning()) as BackupImportJobRecord[];

    return job;
  }

  async markImportFailed(
    id: string,
    errorMessage: string,
  ): Promise<BackupImportJobRecord> {
    const [job] = (await this.db
      .update(this.schema.backupImportJobs)
      .set({
        status: 'failed',
        phase: 'failed',
        errorMessage,
        finishedAt: new Date(),
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning()) as BackupImportJobRecord[];

    return job;
  }

  async delete(id: string) {
    await this.db
      .delete(this.schema.backupJobs)
      .where(eq(this.schema.backupJobs.id, id));
  }
}
