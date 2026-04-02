/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Drizzle exposes a dynamic client shape. */
import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostgresStrategy } from './strategies/postgres-strategy';
import { postgresSchema } from '@mdc/database';

export const DRIZZLE = 'DRIZZLE';

export interface DrizzleClient {
  db: any;
  schema: any;
  dialect: 'postgres';
}

const logger = new Logger('DatabaseProvider');

export const databaseProvider: FactoryProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<DrizzleClient> => {
    const strategy = new PostgresStrategy(configService);

    logger.log('Using Database Provider: POSTGRES');

    try {
      const db = await strategy.connect();
      return {
        db,
        schema: postgresSchema as any,
        dialect: 'postgres',
      };
    } catch (error) {
      logger.error(
        `Failed to connect to postgres database: ${error.message}`,
      );
      throw error;
    }
  },
};
