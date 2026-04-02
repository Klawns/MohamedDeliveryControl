import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as presignGetObjectUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IStorageProvider,
  StorageVisibility,
} from '../../interfaces/storage-provider.interface';

interface ByteArrayBody {
  transformToByteArray(): Promise<Uint8Array>;
}

function hasTransformToByteArray(body: unknown): body is ByteArrayBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'transformToByteArray' in body &&
    typeof body.transformToByteArray === 'function'
  );
}

@Injectable()
export class R2StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private client: S3Client;
  private bucket: string;
  private privateBucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('R2_BUCKET');
    this.privateBucket =
      this.configService.get<string>('R2_PRIVATE_BUCKET') ?? this.bucket;
    this.publicUrl = this.configService.getOrThrow<string>('R2_PUBLIC_URL');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.configService.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  private resolveBucket(visibility: StorageVisibility = 'public') {
    return visibility === 'private' ? this.privateBucket : this.bucket;
  }

  private buildOperationErrorMessage(
    action: 'upload' | 'upload privado' | 'download' | 'delete' | 'signed url',
    bucket: string,
    key: string,
    error: unknown,
  ) {
    const errorName =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      typeof error.name === 'string'
        ? error.name
        : null;

    if (errorName === 'AccessDenied') {
      return `Falha no ${action} para o bucket "${bucket}" e chave "${key}": acesso negado no R2. Verifique se o token possui permissao Object Read e Object Write neste bucket e se a variavel de ambiente aponta para o bucket correto.`;
    }

    if (errorName === 'NoSuchBucket') {
      return `Falha no ${action}: o bucket "${bucket}" nao existe no R2.`;
    }

    if (error instanceof Error && error.message) {
      return `Falha no ${action} para o bucket "${bucket}" e chave "${key}": ${error.message}`;
    }

    return `Falha no ${action} para o bucket "${bucket}" e chave "${key}".`;
  }

  private async bodyToBuffer(body: unknown): Promise<Buffer> {
    if (!body) {
      return Buffer.alloc(0);
    }

    if (Buffer.isBuffer(body)) {
      return body;
    }

    if (hasTransformToByteArray(body)) {
      const bytes = await body.transformToByteArray();
      return Buffer.from(bytes);
    }

    if (
      typeof body === 'object' &&
      body !== null &&
      Symbol.asyncIterator in body
    ) {
      const chunks: Buffer[] = [];

      for await (const chunk of body as AsyncIterable<Buffer | Uint8Array>) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    }

    throw new Error('Resposta de download do storage nao suportada.');
  }

  async upload(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    path: string,
    options?: { cacheControl?: string },
  ): Promise<{ url: string; key: string }> {
    const key = path;
    const bucket = this.resolveBucket('public');

    this.logger.log(`Iniciando upload para R2: ${key} (${file.mimetype})`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl:
            options?.cacheControl ?? 'public, max-age=31536000, immutable',
          ContentDisposition: 'inline',
        }),
      );
      this.logger.log(`Upload concluido com sucesso: ${key}`);
    } catch (error) {
      const message = this.buildOperationErrorMessage(
        'upload',
        bucket,
        key,
        error,
      );

      this.logger.error(
        message,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(message);
    }

    return {
      url: `${this.publicUrl}/${key}`,
      key,
    };
  }

  async uploadPrivate(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    path: string,
    options?: { cacheControl?: string; contentDisposition?: string },
  ): Promise<{ key: string }> {
    const key = path;
    const bucket = this.resolveBucket('private');

    this.logger.log(`Iniciando upload privado para R2: ${key}`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: options?.cacheControl ?? 'private, no-store',
          ContentDisposition:
            options?.contentDisposition ??
            `attachment; filename="${file.originalname}"`,
        }),
      );
      this.logger.log(`Upload privado concluido com sucesso: ${key}`);
    } catch (error) {
      const message = this.buildOperationErrorMessage(
        'upload privado',
        bucket,
        key,
        error,
      );

      this.logger.error(
        message,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(message);
    }

    return { key };
  }

  async delete(
    key: string,
    options?: { visibility?: StorageVisibility },
  ): Promise<void> {
    const bucket = this.resolveBucket(options?.visibility ?? 'public');

    this.logger.log(`Excluindo objeto do R2: ${key}`);

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      this.logger.log(`Objeto excluido com sucesso: ${key}`);
    } catch (error) {
      const message = this.buildOperationErrorMessage(
        'delete',
        bucket,
        key,
        error,
      );

      this.logger.error(
        message,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(message);
    }
  }

  async getSignedUrl(
    key: string,
    options?: {
      expiresInSeconds?: number;
      downloadName?: string;
      visibility?: StorageVisibility;
    },
  ): Promise<string> {
    const bucket = this.resolveBucket(options?.visibility ?? 'private');

    try {
      return await presignGetObjectUrl(
        this.client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          ResponseContentDisposition: options?.downloadName
            ? `attachment; filename="${options.downloadName}"`
            : undefined,
        }),
        {
          expiresIn: options?.expiresInSeconds ?? 300,
        },
      );
    } catch (error) {
      const message = this.buildOperationErrorMessage(
        'signed url',
        bucket,
        key,
        error,
      );

      this.logger.error(
        message,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(message);
    }
  }

  async download(
    key: string,
    options?: { visibility?: StorageVisibility },
  ): Promise<Buffer> {
    const bucket = this.resolveBucket(options?.visibility ?? 'private');

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      return this.bodyToBuffer(response.Body);
    } catch (error) {
      const message = this.buildOperationErrorMessage(
        'download',
        bucket,
        key,
        error,
      );

      this.logger.error(
        message,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(message);
    }
  }
}
