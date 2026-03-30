import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });

  await app.close();
}

void seed().catch((error: unknown) => {
  const logger = new Logger('SeedScript');
  logger.error(
    error instanceof Error ? error.message : 'Unknown seed error',
    error instanceof Error ? error.stack : undefined,
  );
  process.exit(1);
});
