import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { gzipSync } from 'node:zlib';

@Injectable()
export class TechnicalBackupRunnerService {
  constructor(private readonly configService: ConfigService) {}

  private getConnectionString() {
    return (
      this.configService.get<string>('POSTGRES_DATABASE_URL') ??
      this.configService.get<string>('DATABASE_URL')
    );
  }

  async createDumpBuffer() {
    const connectionString = this.getConnectionString();

    if (!connectionString) {
      throw new InternalServerErrorException(
        'DATABASE_URL/POSTGRES_DATABASE_URL nao configurada para backup tecnico.',
      );
    }

    const binary =
      this.configService.get<string>('PG_DUMP_BINARY') ?? 'pg_dump';

    const dumpBuffer = await new Promise<Buffer>((resolve, reject) => {
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      const child = spawn(
        binary,
        [
          '--format=plain',
          '--no-owner',
          '--no-privileges',
          `--dbname=${connectionString}`,
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          env: process.env,
        },
      );

      child.stdout.on('data', (chunk: Buffer | Uint8Array) => {
        stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      child.stderr.on('data', (chunk: Buffer | Uint8Array) => {
        stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      child.on('error', (error) => {
        reject(
          new InternalServerErrorException(
            `Falha ao iniciar pg_dump: ${error.message}`,
          ),
        );
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(stdoutChunks));
          return;
        }

        reject(
          new InternalServerErrorException(
            `pg_dump falhou: ${Buffer.concat(stderrChunks).toString('utf8').trim() || `codigo ${code}`}`,
          ),
        );
      });
    });

    return {
      dumpBuffer: gzipSync(dumpBuffer),
      contentType: 'application/gzip',
      fileExtension: 'sql.gz',
      rawSizeBytes: dumpBuffer.length,
    };
  }
}
