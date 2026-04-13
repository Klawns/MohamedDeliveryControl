import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { IStorageProvider } from '../storage/interfaces/storage-provider.interface';
import { STORAGE_PROVIDER } from '../storage/interfaces/storage-provider.interface';
import {
  hasAllowedUploadImageExtension,
  isAllowedUploadImageFormat,
} from './upload-image.constants';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private static readonly allowedFolders = [
    'images',
    'avatars',
    'posts',
    'thumbnails',
    'rides',
  ] as const;

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private resolveFolder(folder?: string): string {
    return (
      folder &&
      UploadService.allowedFolders.includes(
        folder as (typeof UploadService.allowedFolders)[number],
      )
    )
      ? folder
      : 'images';
  }

  private buildUploadPath(userId: string, folder: string, fileName: string) {
    if (folder === 'rides') {
      return `users/${userId}/rides/${fileName}`;
    }

    return `${folder}/${fileName}`;
  }

  private ensureUploadFile(file: Express.Multer.File | undefined) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Arquivo de imagem nao enviado.');
    }
  }

  private ensureAllowedOriginalExtension(file: Express.Multer.File) {
    if (hasAllowedUploadImageExtension(file.originalname)) {
      return;
    }

    this.logger.warn(
      `Tentativa de upload com extensao invalida: ${file.originalname}`,
    );
    throw new BadRequestException(
      'Arquivo invalido. Envie apenas imagens JPG, PNG ou WEBP.',
    );
  }

  private async ensureSupportedImageContent(file: Express.Multer.File) {
    try {
      const metadata = await sharp(file.buffer, { failOn: 'error' }).metadata();

      if (isAllowedUploadImageFormat(metadata.format)) {
        return;
      }
    } catch (error) {
      this.logger.warn(
        `Falha ao validar o conteudo da imagem ${file.originalname}: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }

    throw new BadRequestException(
      'Arquivo invalido. O conteudo nao e uma imagem suportada (JPG, PNG ou WEBP).',
    );
  }

  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    folder: string = 'images',
  ) {
    const normalizedFolder = this.resolveFolder(folder);
    this.ensureUploadFile(file);
    this.ensureAllowedOriginalExtension(file);

    this.logger.log(
      `Recebendo solicitacao de upload: ${file.originalname} (Tamanho original: ${file.size} bytes) para pasta ${normalizedFolder}`,
    );

    // 1. Validacao real do conteudo da imagem antes do processamento.
    await this.ensureSupportedImageContent(file);

    // 2. Processamento com Sharp
    this.logger.debug(
      `Iniciando processamento Sharp para ${file.originalname}`,
    );
    const start = Date.now();

    const processedBuffer = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 4,
      })
      .toBuffer();

    this.logger.log(
      `Sharp processing time: ${Date.now() - start}ms. Tamanho final: ${processedBuffer.length} bytes`,
    );

    // 3. Gerar nome unico e caminho controlado
    const fileName = `${uuidv4()}.webp`;
    const path = this.buildUploadPath(userId, normalizedFolder, fileName);

    // 4. Upload via Storage Provider
    const uploadFile = {
      buffer: processedBuffer,
      mimetype: 'image/webp',
      originalname: file.originalname,
    };
    const uploadResult =
      normalizedFolder === 'rides'
        ? await this.storageProvider.uploadPrivate(uploadFile, path, {
            cacheControl: 'private, no-store',
            contentDisposition: 'inline',
          })
        : await this.storageProvider.upload(uploadFile, path, {
            cacheControl: 'public, max-age=31536000, immutable',
          });
    const url = 'url' in uploadResult ? uploadResult.url : undefined;
    const { key } = uploadResult;

    // 5. Emitir evento
    this.logger.log(`Disparando evento image.uploaded para ${key}`);
    this.eventEmitter.emit('image.uploaded', {
      url,
      key,
      originalName: file.originalname,
      mimetype: 'image/webp',
    });

    return url ? { url, key } : { key };
  }
}
