import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

type PgDumpExecutionMode = 'binary' | 'docker_compose' | 'auto';
type DumpCommandKind = 'binary' | 'docker_compose';

const MISSING_PG_DUMP_BINARY_MESSAGE =
  'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL, configure PG_DUMP_BINARY ou habilite PG_DUMP_EXECUTION_MODE=auto/docker_compose com PG_DUMP_DOCKER_COMPOSE_SERVICE.';
const MISSING_DOCKER_COMPOSE_SERVICE_MESSAGE =
  'PG_DUMP_DOCKER_COMPOSE_SERVICE e obrigatorio quando PG_DUMP_EXECUTION_MODE=docker_compose.';
const MISSING_DOCKER_MESSAGE =
  'Nao foi possivel iniciar docker compose para executar o pg_dump. Verifique se o Docker Desktop/CLI esta instalado e disponivel na runtime da API.';

class DumpCommandExecutionError extends Error {
  constructor(
    readonly publicMessage: string,
    readonly kind: DumpCommandKind,
    readonly metadata: {
      command: string;
      args: string[];
      binary: string;
      executionMode: PgDumpExecutionMode;
      exitCode?: number | null;
      stderr?: string;
      causeCode?: string;
    },
    options?: { cause?: unknown },
  ) {
    super(publicMessage, options);
  }

  get isMissingExecutable() {
    return this.metadata.causeCode === 'ENOENT';
  }
}

@Injectable()
export class TechnicalBackupRunnerService {
  private readonly logger = new Logger(TechnicalBackupRunnerService.name);

  constructor(private readonly configService: ConfigService) {}

  private getConnectionString() {
    return (
      this.configService.get<string>('POSTGRES_DATABASE_URL') ??
      this.configService.get<string>('DATABASE_URL')
    );
  }

  private getBinary() {
    return this.configService.get<string>('PG_DUMP_BINARY') ?? 'pg_dump';
  }

  private getExecutionMode(): PgDumpExecutionMode {
    const mode =
      this.configService.get<string>('PG_DUMP_EXECUTION_MODE') ?? 'binary';

    if (
      mode === 'binary' ||
      mode === 'docker_compose' ||
      mode === 'auto'
    ) {
      return mode;
    }

    return 'binary';
  }

  private getDumpArguments(connectionString: string) {
    return [
      '--format=plain',
      '--no-owner',
      '--no-privileges',
      `--dbname=${connectionString}`,
    ];
  }

  private resolveDockerComposeFile() {
    const configuredFile = this.configService.get<string>(
      'PG_DUMP_DOCKER_COMPOSE_FILE',
    );

    if (configuredFile) {
      return configuredFile;
    }

    const candidateFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml',
    ];

    let currentDirectory = process.cwd();

    while (true) {
      for (const candidate of candidateFiles) {
        const absoluteCandidate = join(currentDirectory, candidate);

        if (existsSync(absoluteCandidate)) {
          return absoluteCandidate;
        }
      }

      const parentDirectory = dirname(currentDirectory);

      if (parentDirectory === currentDirectory) {
        return undefined;
      }

      currentDirectory = parentDirectory;
    }
  }

  private buildDockerComposeCommand(connectionString: string) {
    const service =
      this.configService.get<string>('PG_DUMP_DOCKER_COMPOSE_SERVICE');

    if (!service) {
      throw new InternalServerErrorException(
        MISSING_DOCKER_COMPOSE_SERVICE_MESSAGE,
      );
    }

    const composeFile = this.resolveDockerComposeFile();
    const args = ['compose'];

    if (composeFile) {
      args.push('-f', composeFile);
    }

    args.push('exec', '-T', service, 'pg_dump', ...this.getDumpArguments(connectionString));

    return {
      kind: 'docker_compose' as const,
      binary: 'docker',
      command: 'docker',
      args,
      service,
      composeFile,
    };
  }

  private buildBinaryCommand(connectionString: string) {
    const binary = this.getBinary();

    return {
      kind: 'binary' as const,
      binary,
      command: binary,
      args: this.getDumpArguments(connectionString),
    };
  }

  private async runDumpCommand(input: {
    kind: DumpCommandKind;
    binary: string;
    command: string;
    args: string[];
  }, executionMode: PgDumpExecutionMode) {
    return new Promise<Buffer>((resolve, reject) => {
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      const child = spawn(input.command, input.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      });

      child.stdout.on('data', (chunk: Buffer | Uint8Array) => {
        stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      child.stderr.on('data', (chunk: Buffer | Uint8Array) => {
        stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      child.on('error', (error) => {
        const startupError = error as NodeJS.ErrnoException;
        this.logger.error(
          {
            context: 'technicalBackupRunner.createDumpBuffer:error',
            binary: input.binary,
            command: input.command,
            executionMode,
            message: error.message,
          },
          error.stack,
        );
        reject(
          new DumpCommandExecutionError(
            this.getStartupErrorMessage(input.kind, startupError),
            input.kind,
            {
              command: input.command,
              args: input.args,
              binary: input.binary,
              executionMode,
              causeCode: startupError.code,
            },
            { cause: error },
          ),
        );
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(stdoutChunks));
          return;
        }

        const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
        this.logger.error({
          context: 'technicalBackupRunner.createDumpBuffer:failed',
          binary: input.binary,
          command: input.command,
          executionMode,
          exitCode: code ?? 'desconhecido',
          stderr,
        });
        reject(
          new DumpCommandExecutionError(
            `pg_dump falhou: ${stderr || `codigo ${code}`}`,
            input.kind,
            {
              command: input.command,
              args: input.args,
              binary: input.binary,
              executionMode,
              exitCode: code,
              stderr,
            },
          ),
        );
      });
    });
  }

  private getStartupErrorMessage(
    kind: DumpCommandKind,
    error: NodeJS.ErrnoException,
  ) {
    if (error.code === 'ENOENT') {
      return kind === 'binary'
        ? MISSING_PG_DUMP_BINARY_MESSAGE
        : MISSING_DOCKER_MESSAGE;
    }

    return kind === 'binary'
      ? `Falha ao iniciar pg_dump: ${error.message}`
      : `Falha ao iniciar docker compose para pg_dump: ${error.message}`;
  }

  async createDumpBuffer() {
    const connectionString = this.getConnectionString();

    if (!connectionString) {
      throw new InternalServerErrorException(
        'DATABASE_URL/POSTGRES_DATABASE_URL nao configurada para backup tecnico.',
      );
    }

    const executionMode = this.getExecutionMode();
    const binary = this.getBinary();

    this.logger.log({
      context: 'technicalBackupRunner.createDumpBuffer:start',
      binary,
      executionMode,
      connectionConfigured: true,
    });

    try {
      const dumpBuffer = await this.executeDump(connectionString, executionMode);
      const compressedDumpBuffer = gzipSync(dumpBuffer);

      this.logger.log({
        context: 'technicalBackupRunner.createDumpBuffer:success',
        binary,
        executionMode,
        rawSizeBytes: dumpBuffer.length,
        compressedSizeBytes: compressedDumpBuffer.length,
      });

      return {
        dumpBuffer: compressedDumpBuffer,
        contentType: 'application/gzip',
        fileExtension: 'sql.gz',
        rawSizeBytes: dumpBuffer.length,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      if (error instanceof DumpCommandExecutionError) {
        throw new InternalServerErrorException(error.publicMessage);
      }

      this.logger.error(
        {
          context: 'technicalBackupRunner.createDumpBuffer:error',
          binary,
          executionMode,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  private async executeDump(
    connectionString: string,
    executionMode: PgDumpExecutionMode,
  ) {
    const binaryCommand = this.buildBinaryCommand(connectionString);

    if (executionMode === 'docker_compose') {
      return this.runDumpCommand(
        this.buildDockerComposeCommand(connectionString),
        executionMode,
      );
    }

    try {
      return await this.runDumpCommand(binaryCommand, executionMode);
    } catch (error) {
      if (
        executionMode === 'auto' &&
        error instanceof DumpCommandExecutionError &&
        error.kind === 'binary' &&
        error.isMissingExecutable &&
        this.configService.get<string>('PG_DUMP_DOCKER_COMPOSE_SERVICE')
      ) {
        const dockerCommand = this.buildDockerComposeCommand(connectionString);

        this.logger.warn({
          context: 'technicalBackupRunner.createDumpBuffer:fallback',
          from: 'binary',
          to: 'docker_compose',
          binary: binaryCommand.binary,
          composeFile: this.resolveDockerComposeFile() ?? null,
          service: this.configService.get<string>(
            'PG_DUMP_DOCKER_COMPOSE_SERVICE',
          ),
        });

        return this.runDumpCommand(dockerCommand, executionMode);
      }

      throw error;
    }
  }
}
