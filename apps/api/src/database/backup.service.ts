import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE } from './database.provider';
import { ConfigService } from '@nestjs/config';
import type { DrizzleClient } from './database.provider';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    @Inject(DRIZZLE) private readonly drizzle: DrizzleClient,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Simple backup strategy: Fetch from source and insert into target.
   * This is a simplified version. For a real production app,
   * consider using specialized tools or a more robust sync logic.
   */
  performBackup(): Promise<void> {
    const provider = this.configService.get<string>('DB_PROVIDER', 'sqlite');

    if (provider !== 'postgres') {
      this.logger.log('Backup skipped: Current provider is not PostgreSQL.');
      return Promise.resolve();
    }

    this.logger.log('Starting data synchronization PostgreSQL -> SQLite...');

    try {
      // Here you would implement the sync logic for each table.
      // Example for users:
      // const allUsers = await this.drizzle.db.select().from(this.drizzle.schema.users);
      // ... connect to a separate SQLite instance and insert ...

      this.logger.log('Synchronization completed successfully (Placeholder).');
    } catch (error: unknown) {
      this.logger.error(
        `Backup failed: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }

    return Promise.resolve();
  }
}
