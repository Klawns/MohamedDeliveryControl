/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Jest mocks are intentionally partial. */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'node:events';
import { PassThrough, Writable } from 'node:stream';
import { spawn } from 'node:child_process';
import { RcloneProcessService } from './rclone-process.service';

jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}));

class MockWritable extends Writable {
  public chunks: Buffer[] = [];

  _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }
}

class MockChildProcess extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();
  stdin = new MockWritable();
}

describe('RcloneProcessService', () => {
  const spawnMock = jest.mocked(spawn);
  let service: RcloneProcessService;
  let configValues: Record<string, string | undefined>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterAll(() => {
    loggerLogSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  beforeEach(() => {
    spawnMock.mockReset();
    loggerLogSpy.mockClear();
    loggerErrorSpy.mockClear();
    configValues = {
      RCLONE_BINARY: 'rclone',
      RCLONE_CONFIG_FILE: '/etc/rclone.conf',
      RCLONE_REMOTE: 'gdrive',
      SYSTEM_BACKUP_REMOTE_PATH: 'system-backups',
    };
    service = new RcloneProcessService({
      get: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService);
  });

  it('uploads buffers with rcat to the configured remote path', async () => {
    const child = new MockChildProcess();
    spawnMock.mockReturnValue(child as never);

    const resultPromise = service.uploadBuffer(
      Buffer.from('dump-content'),
      'technical/manual/2026-04-17/job-1.sql.gz',
    );

    expect(spawnMock).toHaveBeenCalledWith(
      'rclone',
      [
        '--config',
        '/etc/rclone.conf',
        'rcat',
        'gdrive:system-backups/technical/manual/2026-04-17/job-1.sql.gz',
      ],
      expect.objectContaining({
        stdio: ['pipe', 'ignore', 'pipe'],
      }),
    );

    child.emit('close', 0);
    await resultPromise;

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'rcloneProcess.execute:start',
        command: 'rcat',
        remoteTarget:
          'gdrive:system-backups/technical/manual/2026-04-17/job-1.sql.gz',
      }),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'rcloneProcess.execute:success',
        command: 'rcat',
        remoteTarget:
          'gdrive:system-backups/technical/manual/2026-04-17/job-1.sql.gz',
      }),
    );
    expect(Buffer.concat(child.stdin.chunks).toString('utf8')).toBe(
      'dump-content',
    );
  });

  it('surfaces startup errors from rclone upload commands', async () => {
    const child = new MockChildProcess();
    spawnMock.mockReturnValue(child as never);

    const resultPromise = service.uploadBuffer(
      Buffer.from('dump-content'),
      'technical/manual/2026-04-17/job-1.sql.gz',
    );

    child.emit('error', new Error('spawn ENOENT'));

    await expect(resultPromise).rejects.toThrow(
      'Falha ao iniciar rclone (rcat): spawn ENOENT',
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'rcloneProcess.execute:error',
        command: 'rcat',
        remoteTarget:
          'gdrive:system-backups/technical/manual/2026-04-17/job-1.sql.gz',
        message: 'spawn ENOENT',
      }),
      expect.any(String),
    );
  });

  it('opens a readable stream with rclone cat', async () => {
    const child = new MockChildProcess();
    spawnMock.mockReturnValue(child as never);

    const stream = await service.download(
      'technical/manual/2026-04-17/job-1.sql.gz',
    );

    expect(spawnMock).toHaveBeenCalledWith(
      'rclone',
      [
        '--config',
        '/etc/rclone.conf',
        'cat',
        'gdrive:system-backups/technical/manual/2026-04-17/job-1.sql.gz',
      ],
      expect.objectContaining({
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );

    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    child.stdout.end('dump-content');

    await new Promise((resolve) => stream.on('end', resolve));

    expect(Buffer.concat(chunks).toString('utf8')).toBe('dump-content');
  });

  it('deletes a single remote file with deletefile', async () => {
    const child = new MockChildProcess();
    spawnMock.mockReturnValue(child as never);

    const resultPromise = service.deleteFile(
      'technical/manual/2026-04-17/job-1.sql.gz',
    );

    expect(spawnMock).toHaveBeenCalledWith(
      'rclone',
      [
        '--config',
        '/etc/rclone.conf',
        'deletefile',
        'gdrive:system-backups/technical/manual/2026-04-17/job-1.sql.gz',
      ],
      expect.objectContaining({
        stdio: ['ignore', 'ignore', 'pipe'],
      }),
    );

    child.emit('close', 0);
    await resultPromise;
  });
});
