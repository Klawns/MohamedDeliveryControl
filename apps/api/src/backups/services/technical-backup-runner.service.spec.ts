/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Jest mocks are intentionally partial. */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { TechnicalBackupRunnerService } from './technical-backup-runner.service';

jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

describe('TechnicalBackupRunnerService', () => {
  const spawnMock = jest.mocked(spawn);
  const existsSyncMock = jest.mocked(existsSync);
  let service: TechnicalBackupRunnerService;
  let configValues: Record<string, string | undefined>;
  let configService: ConfigService;
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
    existsSyncMock.mockReset();
    loggerLogSpy.mockClear();
    loggerErrorSpy.mockClear();
    existsSyncMock.mockReturnValue(false);
    configValues = {
      POSTGRES_DATABASE_URL: 'postgresql://postgres:secret@postgres:5432/railway',
      DATABASE_URL: undefined,
      PG_DUMP_BINARY: undefined,
      PG_DUMP_EXECUTION_MODE: undefined,
      PG_DUMP_DOCKER_COMPOSE_SERVICE: undefined,
      PG_DUMP_DOCKER_COMPOSE_FILE: undefined,
    };
    configService = {
      get: jest.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;
    service = new TechnicalBackupRunnerService(configService);
  });

  it('should gzip the pg_dump output', async () => {
    const child = new MockChildProcess();
    const dump = Buffer.from('CREATE TABLE public.test(id integer);');
    spawnMock.mockReturnValue(child as never);

    const resultPromise = service.createDumpBuffer();

    expect(spawnMock).toHaveBeenCalledWith(
      'pg_dump',
      [
        '--format=plain',
        '--no-owner',
        '--no-privileges',
        '--dbname=postgresql://postgres:secret@postgres:5432/railway',
      ],
      expect.objectContaining({
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      }),
    );

    child.stdout.emit('data', dump);
    child.emit('close', 0);

    const result = await resultPromise;

    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'technicalBackupRunner.createDumpBuffer:start',
        binary: 'pg_dump',
      }),
    );
    expect(loggerLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'technicalBackupRunner.createDumpBuffer:success',
        binary: 'pg_dump',
        rawSizeBytes: dump.length,
      }),
    );
    expect(result.contentType).toBe('application/gzip');
    expect(result.fileExtension).toBe('sql.gz');
    expect(result.rawSizeBytes).toBe(dump.length);
    expect(gunzipSync(result.dumpBuffer).toString('utf8')).toBe(
      dump.toString('utf8'),
    );
  });

  it('should fail when no database connection string is configured', async () => {
    configValues.POSTGRES_DATABASE_URL = undefined;
    configValues.DATABASE_URL = undefined;

    await expect(service.createDumpBuffer()).rejects.toThrow(
      'DATABASE_URL/POSTGRES_DATABASE_URL nao configurada para backup tecnico.',
    );
  });

  it('should wrap pg_dump startup errors', async () => {
    const child = new MockChildProcess();
    spawnMock.mockReturnValue(child as never);

    const resultPromise = service.createDumpBuffer();

    child.emit(
      'error',
      Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }),
    );

    await expect(resultPromise).rejects.toThrow(
      'pg_dump nao foi encontrado na runtime da API. Instale o cliente PostgreSQL, configure PG_DUMP_BINARY ou habilite PG_DUMP_EXECUTION_MODE=auto/docker_compose com PG_DUMP_DOCKER_COMPOSE_SERVICE.',
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'technicalBackupRunner.createDumpBuffer:error',
        binary: 'pg_dump',
        message: 'spawn ENOENT',
      }),
      expect.any(String),
    );
  });

  it('should run pg_dump through docker compose when docker_compose mode is enabled', async () => {
    const child = new MockChildProcess();
    const dump = Buffer.from('CREATE TABLE public.test(id integer);');
    configValues.PG_DUMP_EXECUTION_MODE = 'docker_compose';
    configValues.PG_DUMP_DOCKER_COMPOSE_SERVICE = 'postgres';
    configValues.PG_DUMP_DOCKER_COMPOSE_FILE = 'A:/Projetos/Mohamed/docker-compose.yml';
    spawnMock.mockReturnValue(child as never);

    const resultPromise = service.createDumpBuffer();

    expect(spawnMock).toHaveBeenCalledWith(
      'docker',
      [
        'compose',
        '-f',
        'A:/Projetos/Mohamed/docker-compose.yml',
        'exec',
        '-T',
        'postgres',
        'pg_dump',
        '--format=plain',
        '--no-owner',
        '--no-privileges',
        '--dbname=postgresql://postgres:secret@postgres:5432/railway',
      ],
      expect.objectContaining({
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      }),
    );

    child.stdout.emit('data', dump);
    child.emit('close', 0);

    const result = await resultPromise;

    expect(gunzipSync(result.dumpBuffer).toString('utf8')).toBe(
      dump.toString('utf8'),
    );
  });

  it('should fallback to docker compose in auto mode when the local pg_dump binary is missing', async () => {
    const binaryChild = new MockChildProcess();
    const dockerChild = new MockChildProcess();
    const dump = Buffer.from('CREATE TABLE public.test(id integer);');
    configValues.PG_DUMP_EXECUTION_MODE = 'auto';
    configValues.PG_DUMP_DOCKER_COMPOSE_SERVICE = 'postgres';
    configValues.PG_DUMP_DOCKER_COMPOSE_FILE = 'A:/Projetos/Mohamed/docker-compose.yml';
    spawnMock
      .mockReturnValueOnce(binaryChild as never)
      .mockReturnValueOnce(dockerChild as never);

    const resultPromise = service.createDumpBuffer();

    binaryChild.emit(
      'error',
      Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }),
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      'docker',
      [
        'compose',
        '-f',
        'A:/Projetos/Mohamed/docker-compose.yml',
        'exec',
        '-T',
        'postgres',
        'pg_dump',
        '--format=plain',
        '--no-owner',
        '--no-privileges',
        '--dbname=postgresql://postgres:secret@postgres:5432/railway',
      ],
      expect.any(Object),
    );

    dockerChild.stdout.emit('data', dump);
    dockerChild.emit('close', 0);

    const result = await resultPromise;

    expect(gunzipSync(result.dumpBuffer).toString('utf8')).toBe(
      dump.toString('utf8'),
    );
  });

  it('should surface stderr when pg_dump exits with an error', async () => {
    const child = new MockChildProcess();
    configValues.POSTGRES_DATABASE_URL = undefined;
    configValues.DATABASE_URL =
      'postgresql://postgres:secret@postgres:5432/railway';
    configValues.PG_DUMP_BINARY = '/usr/lib/postgresql/18/bin/pg_dump';
    spawnMock.mockReturnValue(child as never);

    const resultPromise = service.createDumpBuffer();

    expect(spawnMock).toHaveBeenCalledWith(
      '/usr/lib/postgresql/18/bin/pg_dump',
      [
        '--format=plain',
        '--no-owner',
        '--no-privileges',
        '--dbname=postgresql://postgres:secret@postgres:5432/railway',
      ],
      expect.any(Object),
    );

    child.stderr.emit(
      'data',
      Buffer.from('pg_dump: error: connection to server failed'),
    );
    child.emit('close', 1);

    await expect(resultPromise).rejects.toThrow(
      'pg_dump falhou: pg_dump: error: connection to server failed',
    );
  });
});
