import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import type { DrizzleClient } from '../../database/database.provider';
import { DEFAULT_TECHNICAL_BACKUP_CRON } from '../backups.constants';

export type SystemBackupScheduleMode = 'disabled' | 'fixed_time' | 'interval';
export type SystemBackupRetentionMode = 'count' | 'max_age';

export interface SystemBackupSettings {
  schedule: {
    mode: SystemBackupScheduleMode;
    fixedTime: string | null;
    intervalMinutes: number | null;
  };
  retention: {
    mode: SystemBackupRetentionMode;
    maxCount: number | null;
    maxAgeDays: number | null;
  };
}

type SystemBackupSettingKey =
  | 'SYSTEM_BACKUP_SCHEDULE_MODE'
  | 'SYSTEM_BACKUP_FIXED_TIME'
  | 'SYSTEM_BACKUP_INTERVAL_MINUTES'
  | 'SYSTEM_BACKUP_RETENTION_MODE'
  | 'SYSTEM_BACKUP_RETENTION_COUNT'
  | 'SYSTEM_BACKUP_RETENTION_MAX_AGE_DAYS';

const SYSTEM_BACKUP_SETTING_DESCRIPTIONS: Record<SystemBackupSettingKey, string> =
  {
    SYSTEM_BACKUP_SCHEDULE_MODE:
      'Modo de agendamento do backup sistêmico por pg_dump.',
    SYSTEM_BACKUP_FIXED_TIME:
      'Horario fixo HH:mm do backup sistêmico.',
    SYSTEM_BACKUP_INTERVAL_MINUTES:
      'Intervalo em minutos do backup sistêmico.',
    SYSTEM_BACKUP_RETENTION_MODE:
      'Modo de retencao do backup sistêmico.',
    SYSTEM_BACKUP_RETENTION_COUNT:
      'Quantidade maxima de dumps sistêmicos mantidos.',
    SYSTEM_BACKUP_RETENTION_MAX_AGE_DAYS:
      'Idade maxima em dias dos dumps sistêmicos.',
  };

@Injectable()
export class SystemBackupSettingsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly drizzle: DrizzleClient,
    private readonly configService: ConfigService,
  ) {}

  async getSettings(): Promise<SystemBackupSettings> {
    const configs = await this.getConfigMap();
    const defaultFixedTime = this.getDefaultFixedTime();

    return {
      schedule: {
        mode: this.parseScheduleMode(configs.SYSTEM_BACKUP_SCHEDULE_MODE),
        fixedTime: configs.SYSTEM_BACKUP_FIXED_TIME ?? defaultFixedTime,
        intervalMinutes: this.parseNullablePositiveInt(
          configs.SYSTEM_BACKUP_INTERVAL_MINUTES,
        ),
      },
      retention: {
        mode: this.parseRetentionMode(configs.SYSTEM_BACKUP_RETENTION_MODE),
        maxCount:
          this.parseNullablePositiveInt(configs.SYSTEM_BACKUP_RETENTION_COUNT) ??
          this.configService.get<number>('TECHNICAL_BACKUP_RETENTION_COUNT', 7),
        maxAgeDays: this.parseNullablePositiveInt(
          configs.SYSTEM_BACKUP_RETENTION_MAX_AGE_DAYS,
        ),
      },
    };
  }

  async updateSettings(input: SystemBackupSettings): Promise<SystemBackupSettings> {
    this.validateSettings(input);

    await this.upsertConfig(
      'SYSTEM_BACKUP_SCHEDULE_MODE',
      input.schedule.mode,
    );
    await this.upsertConfig(
      'SYSTEM_BACKUP_FIXED_TIME',
      input.schedule.fixedTime ?? '',
    );
    await this.upsertConfig(
      'SYSTEM_BACKUP_INTERVAL_MINUTES',
      input.schedule.intervalMinutes?.toString() ?? '',
    );
    await this.upsertConfig(
      'SYSTEM_BACKUP_RETENTION_MODE',
      input.retention.mode,
    );
    await this.upsertConfig(
      'SYSTEM_BACKUP_RETENTION_COUNT',
      input.retention.maxCount?.toString() ?? '',
    );
    await this.upsertConfig(
      'SYSTEM_BACKUP_RETENTION_MAX_AGE_DAYS',
      input.retention.maxAgeDays?.toString() ?? '',
    );

    return this.getSettings();
  }

  private get db() {
    return this.drizzle.db;
  }

  private get schema() {
    return this.drizzle.schema;
  }

  private async getConfigMap() {
    const configs = (await this.db
      .select()
      .from(this.schema.systemConfigs)) as Array<{
      key: string;
      value: string;
    }>;

    return configs.reduce(
      (acc, config) => {
        acc[config.key] = config.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  private async upsertConfig(key: SystemBackupSettingKey, value: string) {
    const [existing] = (await this.db
      .select()
      .from(this.schema.systemConfigs)
      .where(eq(this.schema.systemConfigs.key, key))) as Array<{
      key: string;
      value: string;
      description?: string | null;
    }>;

    if (existing) {
      await this.db
        .update(this.schema.systemConfigs)
        .set({
          value,
          description:
            existing.description ?? SYSTEM_BACKUP_SETTING_DESCRIPTIONS[key],
          updatedAt: new Date(),
        })
        .where(eq(this.schema.systemConfigs.key, key));
      return;
    }

    await this.db.insert(this.schema.systemConfigs).values({
      key,
      value,
      description: SYSTEM_BACKUP_SETTING_DESCRIPTIONS[key],
    });
  }

  private getDefaultFixedTime() {
    const configuredCron =
      this.configService.get<string>('TECHNICAL_BACKUP_CRON') ??
      DEFAULT_TECHNICAL_BACKUP_CRON;
    const [minute, hour] = configuredCron.split(' ');
    const safeHour = hour?.padStart(2, '0') ?? '04';
    const safeMinute = minute?.padStart(2, '0') ?? '00';

    return `${safeHour}:${safeMinute}`;
  }

  private parseScheduleMode(value?: string): SystemBackupScheduleMode {
    if (
      value === 'disabled' ||
      value === 'fixed_time' ||
      value === 'interval'
    ) {
      return value;
    }

    return 'fixed_time';
  }

  private parseRetentionMode(value?: string): SystemBackupRetentionMode {
    if (value === 'count' || value === 'max_age') {
      return value;
    }

    return 'count';
  }

  private parseNullablePositiveInt(value?: string) {
    if (!value) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private validateSettings(settings: SystemBackupSettings) {
    if (settings.schedule.mode === 'fixed_time' && !settings.schedule.fixedTime) {
      throw new BadRequestException(
        'Horario fixo obrigatorio para backup sistêmico.',
      );
    }

    if (
      settings.schedule.mode === 'interval' &&
      !settings.schedule.intervalMinutes
    ) {
      throw new BadRequestException(
        'Intervalo obrigatorio para backup sistêmico.',
      );
    }

    if (settings.retention.mode === 'count' && !settings.retention.maxCount) {
      throw new BadRequestException(
        'Quantidade maxima obrigatoria para retencao por contagem.',
      );
    }

    if (settings.retention.mode === 'max_age' && !settings.retention.maxAgeDays) {
      throw new BadRequestException(
        'Idade maxima obrigatoria para retencao por tempo.',
      );
    }
  }
}
