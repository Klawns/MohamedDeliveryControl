/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- The database provider keeps a dialect-agnostic Drizzle boundary for SQLite/Postgres. */
import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SqliteStrategy } from './strategies/sqlite-strategy';
import { PostgresStrategy } from './strategies/postgres-strategy';
import { DatabaseStrategy } from './interfaces/database-strategy.interface';
import { postgresSchema, sqliteSchema } from '@mdc/database';

export const DRIZZLE = 'DRIZZLE';

export interface DrizzleClient {
  db: any;
  schema: any;
  dialect: 'postgres' | 'sqlite';
}

const logger = new Logger('DatabaseProvider');

export const databaseProvider: FactoryProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<DrizzleClient> => {
    const provider = configService
      .get<string>('DB_PROVIDER', 'sqlite')
      .toLowerCase() as 'postgres' | 'sqlite';
    let strategy: DatabaseStrategy;

    logger.log(`Using Database Provider: ${provider.toUpperCase()}`);

    if (provider === 'postgres') {
      strategy = new PostgresStrategy(configService);
    } else {
      strategy = new SqliteStrategy(configService);
    }

    try {
      const db = await strategy.connect();
      return {
        db,
        schema: (provider === 'postgres'
          ? postgresSchema
          : sqliteSchema) as any,
        dialect: provider,
      };
    } catch (error) {
      logger.error(
        `Failed to connect to ${provider} database: ${error.message}`,
      );

      // Fallback logic if Postgres fails and SQLite is configured as backup
      if (
        provider === 'postgres' &&
        configService.get<boolean>('DB_FALLBACK_TO_SQLITE', false)
      ) {
        logger.warn('Attempting fallback to SQLite...');
        strategy = new SqliteStrategy(configService);
        const db = await strategy.connect();
        return {
          db,
          schema: sqliteSchema as any,
          dialect: 'sqlite',
        };
      }

      throw error;
    }
  },
};
