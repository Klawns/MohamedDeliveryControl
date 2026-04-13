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

  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    folder: string = 'images',
  ) {
    const normalizedFolder = this.resolveFolder(folder);

    this.logger.log(
      `Recebendo solicitacao de upload: ${file.originalname} (Tamanho original: ${file.size} bytes) para pasta ${normalizedFolder}`,
    );

    // 1. Validacao rigorosa de MIME type (Magic Numbers - Anti-spoofing)
    const buffer = file.buffer;

    // JPEG: ffd8ff
    const isJpeg =
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    // PNG: 89504e47
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    // WEBP: RIFF....WEBP (Robust check)
    const isWebp =
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      this.logger.warn(
        `Tentativa de upload de arquivo invalido: ${file.originalname} - Header: ${buffer.slice(0, 4).toString('hex')}`,
      );
      throw new BadRequestException(
        'Arquivo invalido. O conteudo nao e uma imagem suportada (JPG, PNG, WEBP).',
      );
    }

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
    const { url, key } = await this.storageProvider.upload(
      {
        buffer: processedBuffer,
        mimetype: 'image/webp',
        originalname: file.originalname,
      },
      path,
      { cacheControl: 'public, max-age=31536000, immutable' },
    );

    // 5. Emitir evento
    this.logger.log(`Disparando evento image.uploaded para ${url}`);
    this.eventEmitter.emit('image.uploaded', {
      url,
      key,
      originalName: file.originalname,
      mimetype: 'image/webp',
    });

    return { url, key };
  }
}
