import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';

@Injectable()
export class RcloneProcessService {
  private readonly logger = new Logger(RcloneProcessService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadBuffer(buffer: Buffer, remotePath: string) {
    const remoteTarget = this.buildRemoteTarget(remotePath);
    this.logger.log({
      context: 'rcloneProcess.execute:start',
      command: 'rcat',
      remoteTarget,
      sizeBytes: buffer.length,
    });

    const child = this.spawnRclone('rcat', remoteTarget, 'pipe', 'ignore');

    if (!child.stdin) {
      throw new InternalServerErrorException(
        'rclone rcat iniciou sem stdin disponivel.',
      );
    }

    child.stdin.end(buffer);

    await this.waitForProcess(child, 'rcat', remoteTarget);
  }

  async download(remotePath: string): Promise<Readable> {
    const remoteTarget = this.buildRemoteTarget(remotePath);
    this.logger.log({
      context: 'rcloneProcess.execute:start',
      command: 'cat',
      remoteTarget,
    });

    const child = this.spawnRclone('cat', remoteTarget, 'ignore', 'pipe');

    child.on('error', (error) => {
      this.logger.error(
        {
          context: 'rcloneProcess.execute:error',
          command: 'cat',
          remoteTarget,
          message: error.message,
        },
        error.stack,
      );
      child.stdout?.destroy(
        new InternalServerErrorException(
          `Falha ao iniciar rclone (cat): ${error.message}`,
        ),
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        this.logger.log({
          context: 'rcloneProcess.execute:success',
          command: 'cat',
          remoteTarget,
        });
        return;
      }

      this.logger.error({
        context: 'rcloneProcess.execute:failed',
        command: 'cat',
        remoteTarget,
        exitCode: code ?? 'desconhecido',
      });
      child.stdout?.destroy(
        new InternalServerErrorException(
          `rclone cat falhou com codigo ${code ?? 'desconhecido'}.`,
        ),
      );
    });

    if (!child.stdout) {
      throw new InternalServerErrorException(
        'rclone cat iniciou sem stdout disponivel.',
      );
    }

    return child.stdout;
  }

  async deleteFile(remotePath: string) {
    const remoteTarget = this.buildRemoteTarget(remotePath);
    this.logger.log({
      context: 'rcloneProcess.execute:start',
      command: 'deletefile',
      remoteTarget,
    });

    const child = this.spawnRclone(
      'deletefile',
      remoteTarget,
      'ignore',
      'ignore',
    );

    await this.waitForProcess(child, 'deletefile', remoteTarget);
  }

  private spawnRclone(
    command: 'rcat' | 'cat' | 'deletefile',
    target: string,
    stdinMode: 'pipe' | 'ignore',
    stdoutMode: 'pipe' | 'ignore',
  ) {
    return spawn(
      this.configService.get<string>('RCLONE_BINARY') ?? 'rclone',
      this.buildArgs(command, target),
      {
        stdio: [stdinMode, stdoutMode, 'pipe'],
      },
    );
  }

  private buildArgs(command: string, target: string) {
    const configFile = this.configService.get<string>('RCLONE_CONFIG_FILE');
    const args: string[] = [];

    if (configFile) {
      args.push('--config', configFile);
    }

    args.push(command, target);

    return args;
  }

  private buildRemoteTarget(remotePath: string) {
    const remote = this.configService.get<string>('RCLONE_REMOTE');
    if (!remote) {
      throw new InternalServerErrorException(
        'RCLONE_REMOTE nao configurado para backup sistemico.',
      );
    }

    const prefix = this.configService.get<string>('SYSTEM_BACKUP_REMOTE_PATH');
    const normalizedRemote = remote.endsWith(':') ? remote.slice(0, -1) : remote;
    const normalizedPrefix = prefix?.replace(/^\/+|\/+$/g, '') ?? '';
    const normalizedPath = remotePath.replace(/^\/+/, '');
    const suffix = normalizedPrefix
      ? `${normalizedPrefix}/${normalizedPath}`
      : normalizedPath;

    return `${normalizedRemote}:${suffix}`;
  }

  private waitForProcess(
    child: ReturnType<typeof spawn>,
    command: 'rcat' | 'deletefile',
    remoteTarget: string,
  ) {
    return new Promise<void>((resolve, reject) => {
      const stderrChunks: Buffer[] = [];

      child.stderr?.on('data', (chunk: Buffer | Uint8Array) => {
        stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      child.on('error', (error) => {
        this.logger.error(
          {
            context: 'rcloneProcess.execute:error',
            command,
            remoteTarget,
            message: error.message,
          },
          error.stack,
        );
        reject(
          new InternalServerErrorException(
            `Falha ao iniciar rclone (${command}): ${error.message}`,
          ),
        );
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.logger.log({
            context: 'rcloneProcess.execute:success',
            command,
            remoteTarget,
          });
          resolve();
          return;
        }

        const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
        this.logger.error({
          context: 'rcloneProcess.execute:failed',
          command,
          remoteTarget,
          exitCode: code ?? 'desconhecido',
          stderr,
        });
        reject(
          new InternalServerErrorException(
            stderr
              ? `rclone ${command} falhou: ${stderr}`
              : `rclone ${command} falhou com codigo ${code ?? 'desconhecido'}.`,
          ),
        );
      });
    });
  }
}
