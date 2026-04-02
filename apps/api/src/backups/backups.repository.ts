/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Drizzle is consumed through a dialect-agnostic runtime boundary in this repository. */
import { Inject, Injectable } from '@nestjs/common';
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
  }) {
    const [job] = await this.db
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
      .returning();

    return job;
  }

  createManualFunctionalJob(userId: string) {
    return this.createBackupJob({
      kind: FUNCTIONAL_BACKUP_KIND,
      trigger: MANUAL_BACKUP_TRIGGER,
      scopeUserId: userId,
      actorUserId: userId,
    });
  }

  createScheduledFunctionalJob(userId: string) {
    return this.createBackupJob({
      kind: FUNCTIONAL_BACKUP_KIND,
      trigger: SCHEDULED_BACKUP_TRIGGER,
      scopeUserId: userId,
      actorUserId: userId,
    });
  }

  createPreImportJob(userId: string, actorUserId: string) {
    return this.createBackupJob({
      kind: PRE_IMPORT_BACKUP_KIND,
      trigger: PRE_IMPORT_BACKUP_TRIGGER,
      scopeUserId: userId,
      actorUserId,
    });
  }

  createTechnicalJob(trigger: BackupTrigger, actorUserId?: string | null) {
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
  }) {
    const [job] = await this.db
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
      .returning();

    return job;
  }

  async findById(id: string) {
    const [job] = await this.db
      .select()
      .from(this.schema.backupJobs)
      .where(eq(this.schema.backupJobs.id, id))
      .limit(1);

    return job;
  }

  async findUserJob(userId: string, id: string) {
    const [job] = await this.db
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
      .limit(1);

    return job;
  }

  async findTechnicalJob(id: string) {
    const [job] = await this.db
      .select()
      .from(this.schema.backupJobs)
      .where(
        and(
          eq(this.schema.backupJobs.id, id),
          eq(this.schema.backupJobs.kind, TECHNICAL_BACKUP_KIND),
        ),
      )
      .limit(1);

    return job;
  }

  async listUserJobs(userId: string, maxResults?: number) {
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
      return query.limit(maxResults);
    }

    return query;
  }

  async listTechnicalJobs(maxResults?: number) {
    const query = this.db
      .select()
      .from(this.schema.backupJobs)
      .where(eq(this.schema.backupJobs.kind, TECHNICAL_BACKUP_KIND))
      .orderBy(desc(this.schema.backupJobs.createdAt));

    if (typeof maxResults === 'number' && maxResults > 0) {
      return query.limit(maxResults);
    }

    return query;
  }

  async listSuccessfulFunctionalJobs(userId: string) {
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
      .orderBy(desc(this.schema.backupJobs.createdAt));
  }

  async listSuccessfulTechnicalJobs() {
    return this.db
      .select()
      .from(this.schema.backupJobs)
      .where(
        and(
          eq(this.schema.backupJobs.kind, TECHNICAL_BACKUP_KIND),
          eq(this.schema.backupJobs.status, 'success'),
        ),
      )
      .orderBy(desc(this.schema.backupJobs.createdAt));
  }

  async findImportJob(userId: string, id: string) {
    const [job] = await this.db
      .select()
      .from(this.schema.backupImportJobs)
      .where(
        and(
          eq(this.schema.backupImportJobs.id, id),
          eq(this.schema.backupImportJobs.scopeUserId, userId),
        ),
      )
      .limit(1);

    return job;
  }

  async markRunning(id: string) {
    const [job] = await this.db
      .update(this.schema.backupJobs)
      .set({
        status: 'running',
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      })
      .where(eq(this.schema.backupJobs.id, id))
      .returning();

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
  ) {
    const [job] = await this.db
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
      .returning();

    return job;
  }

  async markFailed(id: string, errorMessage: string) {
    const [job] = await this.db
      .update(this.schema.backupJobs)
      .set({
        status: 'failed',
        errorMessage,
        finishedAt: new Date(),
      })
      .where(eq(this.schema.backupJobs.id, id))
      .returning();

    return job;
  }

  async markImportRunning(id: string, phase: BackupImportPhase = 'backing_up') {
    const [job] = await this.db
      .update(this.schema.backupImportJobs)
      .set({
        status: 'running',
        phase,
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning();

    return job;
  }

  async updateImportPhase(id: string, phase: BackupImportPhase) {
    const [job] = await this.db
      .update(this.schema.backupImportJobs)
      .set({
        phase,
        errorMessage: null,
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning();

    return job;
  }

  async markImportSuccess(id: string, previewJson: string) {
    const [job] = await this.db
      .update(this.schema.backupImportJobs)
      .set({
        status: 'success',
        phase: 'completed',
        previewJson,
        finishedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning();

    return job;
  }

  async markImportFailed(id: string, errorMessage: string) {
    const [job] = await this.db
      .update(this.schema.backupImportJobs)
      .set({
        status: 'failed',
        phase: 'failed',
        errorMessage,
        finishedAt: new Date(),
      })
      .where(eq(this.schema.backupImportJobs.id, id))
      .returning();

    return job;
  }

  async delete(id: string) {
    await this.db
      .delete(this.schema.backupJobs)
      .where(eq(this.schema.backupJobs.id, id));
  }
}
