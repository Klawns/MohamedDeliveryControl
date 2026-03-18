import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IStorageProvider } from '../../interfaces/storage-provider.interface';

@Injectable()
export class R2StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('R2_BUCKET');
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

  async upload(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    path: string,
    options?: { cacheControl?: string },
  ): Promise<{ url: string; key: string }> {
    const key = path;
    this.logger.log(`Iniciando upload para R2: ${key} (${file.mimetype})`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl:
            options?.cacheControl || 'public, max-age=31536000, immutable',
          ContentDisposition: 'inline',
        }),
      );
      this.logger.log(`Upload concluído com sucesso: ${key}`);
    } catch (error) {
      this.logger.error(
        `Falha no upload para R2: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    return {
      url: `${this.publicUrl}/${key}`,
      key,
    };
  }

  async delete(key: string): Promise<void> {
    this.logger.log(`Excluindo objeto do R2: ${key}`);
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`Objeto excluído com sucesso: ${key}`);
    } catch (error) {
      this.logger.error(
        `Falha ao excluir objeto do R2: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
