import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  BACKUPS_QUEUE,
  DEFAULT_FUNCTIONAL_BACKUP_CRON,
  DEFAULT_TECHNICAL_BACKUP_CRON,
  FUNCTIONAL_BACKUP_SCHEDULER_ID,
  RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
  RUN_TECHNICAL_BACKUP_SCHEDULE_JOB,
} from './backups.constants';

type BackupAutomationHealth = 'disabled' | 'registered' | 'failed';

@Injectable()
export class BackupsAutomationService implements OnModuleInit {
  private readonly logger = new Logger(BackupsAutomationService.name);
  private status: {
    health: BackupAutomationHealth;
    automationEnabled: boolean;
    functionalCron: string;
    technicalCron: string;
    functionalRegistered: boolean;
    technicalRegistered: boolean;
    lastCheckedAt: string | null;
  } = {
    health: 'disabled',
    automationEnabled: false,
    functionalCron: DEFAULT_FUNCTIONAL_BACKUP_CRON,
    technicalCron: DEFAULT_TECHNICAL_BACKUP_CRON,
    functionalRegistered: false,
    technicalRegistered: false,
    lastCheckedAt: null,
  };

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(BACKUPS_QUEUE)
    private readonly backupsQueue: Queue,
  ) {}

  async onModuleInit() {
    const automationEnabled =
      this.configService.get<string>('BACKUP_AUTOMATION_ENABLED') === 'true';
    const functionalCron =
      this.configService.get<string>('FUNCTIONAL_BACKUP_CRON') ??
      DEFAULT_FUNCTIONAL_BACKUP_CRON;
    const technicalCron =
      this.configService.get<string>('TECHNICAL_BACKUP_CRON') ??
      DEFAULT_TECHNICAL_BACKUP_CRON;

    this.status = {
      health: automationEnabled ? 'failed' : 'disabled',
      automationEnabled,
      functionalCron,
      technicalCron,
      functionalRegistered: false,
      technicalRegistered: false,
      lastCheckedAt: new Date().toISOString(),
    };

    if (!automationEnabled) {
      this.logger.warn(
        'Automacao de backup desativada. Apenas backups manuais estao disponiveis.',
      );
      return;
    }

    try {
      await this.cleanupLegacySchedules();

      await this.registerScheduler(
        FUNCTIONAL_BACKUP_SCHEDULER_ID,
        RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB,
        functionalCron,
      );
      this.status.functionalRegistered = true;

      this.status.health = 'registered';

      this.logger.log(`Automacao funcional registrada. Funcional: ${functionalCron}.`);
    } catch (error) {
      this.status.health = 'failed';
      this.status.lastCheckedAt = new Date().toISOString();
      this.logger.error(
        'Falha ao registrar automacao de backup.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  getStatus() {
    return { ...this.status };
  }

  private async registerScheduler(
    schedulerId: string,
    jobName: string,
    pattern: string,
  ) {
    await this.backupsQueue.upsertJobScheduler(
      schedulerId,
      {
        pattern,
      },
      {
        name: jobName,
        data: {},
        opts: {
          removeOnComplete: true,
        },
      },
    );
  }

  private async cleanupLegacySchedules() {
    const legacyRepeatableJobs = await this.backupsQueue.getRepeatableJobs();
    let removedLegacySchedule = false;

    for (const job of legacyRepeatableJobs) {
      if (
        job.name !== RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB &&
        job.name !== RUN_TECHNICAL_BACKUP_SCHEDULE_JOB
      ) {
        continue;
      }

      await this.backupsQueue.removeRepeatableByKey(job.key);
      removedLegacySchedule = true;

      this.logger.warn(
        `Schedule legado removido do Redis para ${job.name}. Chave: ${job.key}`,
      );
    }

    if (!removedLegacySchedule) {
      return;
    }

    const queuedControlJobs = await this.backupsQueue.getJobs(
      ['delayed', 'wait', 'waiting', 'paused', 'prioritized'],
      0,
      100,
      true,
    );

    for (const job of queuedControlJobs) {
      if (
        job.name !== RUN_FUNCTIONAL_BACKUPS_SCHEDULE_JOB &&
        job.name !== RUN_TECHNICAL_BACKUP_SCHEDULE_JOB
      ) {
        continue;
      }

      await job.remove();

      this.logger.warn(
        `Job de controle legado removido da fila: ${job.name}. Job ID: ${job.id}`,
      );
    }
  }
}
