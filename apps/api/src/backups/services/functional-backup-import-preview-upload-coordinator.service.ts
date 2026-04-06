import { Inject, Injectable, Logger } from '@nestjs/common';
import { PassThrough } from 'node:stream';
import { STORAGE_PROVIDER } from '../../storage/interfaces/storage-provider.interface';
import type { IStorageProvider } from '../../storage/interfaces/storage-provider.interface';
import type { BackupImportUploadSource } from '../utils/backup-import-upload.util';
import { FunctionalBackupImportArchiveParserService } from './functional-backup-import-archive-parser.service';
import type { ParsedFunctionalBackupArchive } from './functional-backup-import.types';

@Injectable()
export class FunctionalBackupImportPreviewUploadCoordinatorService {
  private readonly logger = new Logger(
    FunctionalBackupImportPreviewUploadCoordinatorService.name,
  );

  constructor(
    private readonly archiveParser: FunctionalBackupImportArchiveParserService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadAndParseArchive(
    upload: BackupImportUploadSource,
    storageKey: string,
    options: {
      contentDisposition: string;
      fallbackOriginalName: string;
    },
  ): Promise<ParsedFunctionalBackupArchive> {
    const uploadStream = new PassThrough();
    let uploadCompleted = false;

    const uploadPromise = this.storageProvider
      .uploadPrivateStream(
        {
          stream: uploadStream,
          mimetype: upload.mimetype,
          originalname: upload.originalname || options.fallbackOriginalName,
        },
        storageKey,
        {
          contentDisposition: options.contentDisposition,
        },
      )
      .then((result) => {
        uploadCompleted = true;
        return result;
      });

    try {
      const parsedArchive = await this.archiveParser.parseArchiveSource(
        upload.stream as AsyncIterable<Buffer | Uint8Array | string>,
        async (chunk) => {
          await this.writeChunkToWritable(uploadStream, chunk);
        },
      );

      uploadStream.end();
      await upload.completed;
      await uploadPromise;

      return parsedArchive;
    } catch (error) {
      upload.cancel(error instanceof Error ? error : undefined);
      uploadStream.destroy(
        error instanceof Error ? error : new Error('Importacao interrompida.'),
      );

      try {
        await uploadPromise;
      } catch {
        // The original failure is handled by the caller.
      }

      if (uploadCompleted) {
        await this.cleanupUploadedArchive(storageKey);
      }

      throw error;
    }
  }

  async cleanupUploadedArchive(storageKey: string) {
    try {
      await this.storageProvider.delete(storageKey, {
        visibility: 'private',
      });
    } catch (error) {
      this.logger.error(
        {
          context: 'cleanupUploadedArchive',
          storageKey,
          message:
            error instanceof Error ? error.message : 'Erro desconhecido',
        },
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async writeChunkToWritable(stream: PassThrough, chunk: Buffer) {
    if (stream.destroyed || !stream.writable) {
      throw new Error('Upload de backup interrompido.');
    }

    if (stream.write(chunk)) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        stream.off('drain', handleDrain);
        stream.off('error', handleError);
        stream.off('close', handleClose);
      };

      const handleDrain = () => {
        cleanup();
        resolve();
      };

      const handleError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const handleClose = () => {
        cleanup();
        reject(new Error('Upload de backup interrompido.'));
      };

      stream.once('drain', handleDrain);
      stream.once('error', handleError);
      stream.once('close', handleClose);
    });
  }
}
