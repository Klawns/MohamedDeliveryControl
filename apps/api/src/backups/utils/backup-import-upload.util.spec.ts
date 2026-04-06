import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { Readable } from 'node:stream';
import { parseBackupImportUploadRequest } from './backup-import-upload.util';

function createMultipartRequest(parts: string[], boundary = '----backup-boundary') {
  const body = Buffer.from(
    `${parts.join('')}--${boundary}--\r\n`,
    'utf8',
  );
  const request = Readable.from([body]) as Request;

  request.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  };

  return { boundary, request };
}

function createFilePart(
  boundary: string,
  filename: string,
  content: string,
  mimeType = 'application/zip',
) {
  return `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n`;
}

function createFieldPart(boundary: string, name: string, value: string) {
  return `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
}

async function readStream(stream: AsyncIterable<Buffer | Uint8Array>) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

describe('parseBackupImportUploadRequest', () => {
  it('should accept a single zip file upload stream', async () => {
    const boundary = '----backup-boundary-valid';
    const { request } = createMultipartRequest(
      [createFilePart(boundary, 'backup.zip', 'zip-content')],
      boundary,
    );

    const upload = await parseBackupImportUploadRequest(request);
    const content = await readStream(upload.stream);

    await expect(upload.completed).resolves.toBeUndefined();
    expect(upload.fieldName).toBe('file');
    expect(upload.originalname).toBe('backup.zip');
    expect(upload.mimetype).toBe('application/zip');
    expect(content.toString('utf8')).toBe('zip-content');
  });

  it('should reject multipart requests with extra form fields', async () => {
    const boundary = '----backup-boundary-fields';
    const { request } = createMultipartRequest(
      [
        createFieldPart(boundary, 'unexpected', 'value'),
        createFilePart(boundary, 'backup.zip', 'zip-content'),
      ],
      boundary,
    );

    await expect(parseBackupImportUploadRequest(request)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should reject a second uploaded file through the completion promise', async () => {
    const boundary = '----backup-boundary-files';
    const { request } = createMultipartRequest(
      [
        createFilePart(boundary, 'backup.zip', 'zip-content'),
        createFilePart(boundary, 'backup-2.zip', 'zip-content-2'),
      ],
      boundary,
    );

    const upload = await parseBackupImportUploadRequest(request);

    upload.stream.resume();

    await expect(upload.completed).rejects.toBeInstanceOf(BadRequestException);
  });
});
