import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@mdc/database';

export const DRIZZLE = 'DRIZZLE';

export const databaseProvider: FactoryProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const url = configService.get<string>('DATABASE_URL');
    const authToken = configService.get<string>('DATABASE_AUTH_TOKEN');

    console.log(`[Database] Connecting to: ${url ? url.substring(0, 15) + '...' : 'MISSING'}`);

    if (!url) {
      throw new Error('DATABASE_URL not found in environment');
    }

    // Importação dinâmica para lidar com pacote ESM em ambiente CJS
    const { createClient } = await import('@libsql/client');

    const client = createClient({
      url,
      authToken,
    });

    return drizzle(client, { schema });
  },
};
