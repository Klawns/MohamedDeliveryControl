import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { BackupsController } from '../src/backups/backups.controller';
import { DEFAULT_BACKUP_IMPORT_FILE_SIZE_LIMIT_BYTES } from '../src/backups/backups.constants';
import { BackupsService } from '../src/backups/backups.service';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    class MockJwtAuthGuard implements CanActivate {
      canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        request.user = { id: 'user-1' };
        return true;
      }
    }

    return MockJwtAuthGuard;
  },
}));

describe('BackupsController import preview (e2e)', () => {
  let app: INestApplication<App>;
  const backupsServiceMock = {
    createManualFunctionalBackup: jest.fn(),
    listUserBackups: jest.fn(),
    getUserBackupStatus: jest.fn(),
    getDownloadUrl: jest.fn(),
    previewFunctionalImport: jest.fn(),
    executeFunctionalImport: jest.fn(),
    getFunctionalImportStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    backupsServiceMock.previewFunctionalImport.mockImplementation(
      async (userId: string, upload: any) => {
        for await (const _chunk of upload.stream as AsyncIterable<Buffer>) {
          // Drain the request stream to mirror the real import service flow.
        }

        await upload.completed;

        return {
          status: 'validated',
          userId,
        };
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BackupsController],
      providers: [
        {
          provide: BackupsService,
          useValue: backupsServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts a valid multipart zip upload and forwards the parsed stream', async () => {
    backupsServiceMock.previewFunctionalImport.mockImplementationOnce(
      async (userId: string, upload: any) => {
        const chunks: Buffer[] = [];

        for await (const chunk of upload.stream as AsyncIterable<Buffer>) {
          chunks.push(Buffer.from(chunk));
        }

        await upload.completed;

        return {
          fieldName: upload.fieldName,
          mimetype: upload.mimetype,
          originalname: upload.originalname,
          sizeBytes: Buffer.concat(chunks).length,
          userId,
        };
      },
    );

    const response = await request(app.getHttpServer())
      .post('/backups/import/preview')
      .attach('file', Buffer.from('zip-content'), 'backup.zip')
      .expect(201);

    expect(response.body).toEqual({
      fieldName: 'file',
      mimetype: 'application/zip',
      originalname: 'backup.zip',
      sizeBytes: Buffer.byteLength('zip-content'),
      userId: 'user-1',
    });
    expect(backupsServiceMock.previewFunctionalImport).toHaveBeenCalledTimes(1);
  });

  it('rejects multipart requests with extra fields before reaching the service', async () => {
    const response = await request(app.getHttpServer())
      .post('/backups/import/preview')
      .field('note', 'unexpected')
      .attach('file', Buffer.from('zip-content'), 'backup.zip')
      .expect(400);

    expect(response.body.message).toBe(
      'Campos adicionais nao sao permitidos neste endpoint.',
    );
    expect(backupsServiceMock.previewFunctionalImport).not.toHaveBeenCalled();
  });

  it('rejects multipart requests with more than one file before reaching the service', async () => {
    const response = await request(app.getHttpServer())
      .post('/backups/import/preview')
      .attach('file', Buffer.from('zip-content-1'), 'backup.zip')
      .attach('file', Buffer.from('zip-content-2'), 'backup-2.zip')
      .expect(400);

    expect(response.body.message).toBe(
      'Apenas um arquivo .zip e aceito por requisicao.',
    );
  });

  it('rejects uploads that exceed the configured compacted file size limit', async () => {
    const response = await request(app.getHttpServer())
      .post('/backups/import/preview')
      .attach(
        'file',
        Buffer.alloc(DEFAULT_BACKUP_IMPORT_FILE_SIZE_LIMIT_BYTES + 1, 0x61),
        'backup.zip',
      )
      .expect(400);

    expect(response.body.message).toBe(
      `Arquivo de backup excede o limite de ${DEFAULT_BACKUP_IMPORT_FILE_SIZE_LIMIT_BYTES} bytes.`,
    );
    expect(backupsServiceMock.previewFunctionalImport).toHaveBeenCalledTimes(1);
  });
});
