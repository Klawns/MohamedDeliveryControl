import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../apps/api/.env', quiet: true });

const databaseUrl =
  process.env.DRIZZLE_DATABASE_URL ??
  process.env.POSTGRES_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'POSTGRES_DATABASE_URL or DATABASE_URL is required to run Drizzle commands.',
  );
}

export default defineConfig({
  schema: './schema.ts',
  out: './drizzle/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
