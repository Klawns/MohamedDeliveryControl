import { DatabaseStrategy } from '../interfaces/database-strategy.interface';
import { drizzle } from 'drizzle-orm/libsql';
import { ConfigService } from '@nestjs/config';
import { sqliteSchema as schema } from '@mdc/database';

export class SqliteStrategy implements DatabaseStrategy {
  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<any> {
    const url = this.configService.get<string>('DATABASE_URL');
    const authToken = this.configService.get<string>('DATABASE_AUTH_TOKEN');

    if (!url) {
      throw new Error(
        'DATABASE_URL requested for SQLite but not found in environment',
      );
    }

    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url,
      authToken,
    });

    return drizzle(client, { schema });
  }
}
