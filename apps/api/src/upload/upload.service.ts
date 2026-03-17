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

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async uploadImage(file: Express.Multer.File, folder: string = 'images') {
    this.logger.log(
      `Recebendo solicitação de upload: ${file.originalname} (Tamanho original: ${file.size} bytes) para pasta ${folder}`,
    );

    // 1. Sanitizar folder
    const allowedFolders = ['images', 'avatars', 'posts', 'thumbnails'];
    if (!allowedFolders.includes(folder)) {
      folder = 'images';
    }

    // 2. Validação rigorosa de MIME type (Magic Numbers - Anti-spoofing)
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
        `Tentativa de upload de arquivo inválido: ${file.originalname} - Header: ${buffer.slice(0, 4).toString('hex')}`,
      );
      throw new BadRequestException(
        'Arquivo inválido. O conteúdo não é uma imagem suportada (JPG, PNG, WEBP).',
      );
    }

    // 3. Processamento com Sharp (Otimização Máxima)
    this.logger.debug(
      `Iniciando processamento Sharp para ${file.originalname}`,
    );
    const start = Date.now();

    const processedBuffer = await sharp(file.buffer)
      .rotate() // Corrige orientação baseada em EXIF
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 4, // Melhor compressão (Custo de CPU vs Tamanho)
      })
      .toBuffer();

    this.logger.log(
      `Sharp processing time: ${Date.now() - start}ms. Tamanho final: ${processedBuffer.length} bytes`,
    );

    // 4. Gerar nome único
    const fileName = `${uuidv4()}.webp`;
    const path = `${folder}/${fileName}`;

    // 5. Upload via Storage Provider (Strategy)
    const { url, key } = await this.storageProvider.upload(
      {
        buffer: processedBuffer,
        mimetype: 'image/webp',
        originalname: file.originalname,
      },
      path,
      { cacheControl: 'public, max-age=31536000, immutable' },
    );

    // 6. Emitir Evento (Observer Pattern)
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
