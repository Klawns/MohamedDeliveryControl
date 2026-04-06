import { AsyncUnzipInflate, Unzip, type UnzipFile } from 'fflate';
import { Readable } from 'node:stream';
import { setImmediate as waitForNextTick } from 'node:timers/promises';
import { createCrc32Accumulator } from './crc32.util';
import {
  DEFAULT_BACKUP_IMPORT_MAX_COMPRESSION_RATIO,
  DEFAULT_BACKUP_IMPORT_MAX_ENTRY_BYTES,
  DEFAULT_BACKUP_IMPORT_MAX_ENTRY_COUNT,
  DEFAULT_BACKUP_IMPORT_MAX_UNCOMPRESSED_BYTES,
} from '../backups.constants';

export interface ZipArchiveEntry {
  name: string;
  content: Buffer;
}

export interface ZipArchiveReadOptions {
  allowedEntryNames?: readonly string[];
  blockNestedZip?: boolean;
  chunkSizeBytes?: number;
  maxCompressionRatio?: number;
  maxEntries?: number;
  maxEntryBytes?: number;
  maxTotalUncompressedBytes?: number;
  onChunk?(chunk: Buffer): Promise<void> | void;
}

export class ZipArchiveValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZipArchiveValidationError';
  }
}

const DEFAULT_CHUNK_SIZE_BYTES = 64 * 1024;
const DEFAULT_EVENT_LOOP_YIELD_INTERVAL = 16;
const ZIP_LOCAL_FILE_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const ZIP_LOCAL_FILE_SIGNATURE_VALUE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE_VALUE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE_VALUE = 0x06054b50;
const ZIP_ZIP64_END_OF_CENTRAL_DIRECTORY_SIGNATURE_VALUE = 0x06064b50;
const ZIP_GENERAL_PURPOSE_DATA_DESCRIPTOR_FLAG = 0x0008;
const ZIP_GENERAL_PURPOSE_UTF8_FLAG = 0x0800;
const ZIP_LOCAL_FILE_HEADER_BYTES = 30;

interface ZipLocalFileMetadata {
  expectedCrc32: number;
  name: string;
}

class ZipLocalFileMetadataReader {
  private bufferedChunk = Buffer.alloc(0);
  private readonly queuedEntries: ZipLocalFileMetadata[] = [];
  private remainingCompressedBytes = 0;
  private reachedCentralDirectory = false;

  consumeEntryMetadata(expectedEntryName: string) {
    const nextEntry = this.queuedEntries.shift();

    if (!nextEntry) {
      throw toArchiveError(
        `Metadados de integridade ausentes para a entrada ${expectedEntryName}.`,
      );
    }

    if (nextEntry.name !== expectedEntryName) {
      throw toArchiveError(
        `Estrutura ZIP invalida para a entrada ${expectedEntryName}.`,
      );
    }

    return nextEntry;
  }

  pushChunk(chunk: Buffer) {
    if (this.reachedCentralDirectory || chunk.length === 0) {
      return;
    }

    this.bufferedChunk =
      this.bufferedChunk.length === 0
        ? chunk
        : Buffer.concat([this.bufferedChunk, chunk]);

    while (this.bufferedChunk.length > 0) {
      if (this.remainingCompressedBytes > 0) {
        const consumedBytes = Math.min(
          this.remainingCompressedBytes,
          this.bufferedChunk.length,
        );
        this.remainingCompressedBytes -= consumedBytes;
        this.bufferedChunk = this.bufferedChunk.subarray(consumedBytes);

        if (this.remainingCompressedBytes > 0) {
          return;
        }

        continue;
      }

      if (this.bufferedChunk.length < 4) {
        return;
      }

      const signature = this.bufferedChunk.readUInt32LE(0);

      if (
        signature === ZIP_CENTRAL_DIRECTORY_SIGNATURE_VALUE ||
        signature === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE_VALUE ||
        signature === ZIP_ZIP64_END_OF_CENTRAL_DIRECTORY_SIGNATURE_VALUE
      ) {
        this.reachedCentralDirectory = true;
        return;
      }

      if (signature !== ZIP_LOCAL_FILE_SIGNATURE_VALUE) {
        throw toArchiveError('Estrutura ZIP invalida ou corrompida.');
      }

      if (this.bufferedChunk.length < ZIP_LOCAL_FILE_HEADER_BYTES) {
        return;
      }

      const generalPurposeFlags = this.bufferedChunk.readUInt16LE(6);
      const compressedBytes = this.bufferedChunk.readUInt32LE(18);
      const fileNameBytes = this.bufferedChunk.readUInt16LE(26);
      const extraFieldBytes = this.bufferedChunk.readUInt16LE(28);
      const headerBytes =
        ZIP_LOCAL_FILE_HEADER_BYTES + fileNameBytes + extraFieldBytes;

      if (this.bufferedChunk.length < headerBytes) {
        return;
      }

      if ((generalPurposeFlags & ZIP_GENERAL_PURPOSE_DATA_DESCRIPTOR_FLAG) !== 0) {
        throw toArchiveError(
          'Arquivo ZIP usa data descriptor e nao pode ter a integridade verificada com seguranca.',
        );
      }

      const entryName = normalizeEntryName(
        this.bufferedChunk.toString(
          (generalPurposeFlags & ZIP_GENERAL_PURPOSE_UTF8_FLAG) !== 0
            ? 'utf8'
            : 'latin1',
          ZIP_LOCAL_FILE_HEADER_BYTES,
          ZIP_LOCAL_FILE_HEADER_BYTES + fileNameBytes,
        ),
      );

      this.queuedEntries.push({
        expectedCrc32: this.bufferedChunk.readUInt32LE(14),
        name: entryName,
      });

      this.bufferedChunk = this.bufferedChunk.subarray(headerBytes);
      this.remainingCompressedBytes = compressedBytes;
    }
  }
}

function normalizeEntryName(name: string) {
  return name.replace(/\\/g, '/').trim();
}

function isUnsafeEntryName(name: string) {
  return (
    name.length === 0 ||
    name.endsWith('/') ||
    name.startsWith('/') ||
    name.includes('../') ||
    name.includes('..\\')
  );
}

function hasNestedZipSignature(chunk: Buffer) {
  return (
    chunk.length >= ZIP_LOCAL_FILE_SIGNATURE.length &&
    chunk.subarray(0, ZIP_LOCAL_FILE_SIGNATURE.length).equals(
      ZIP_LOCAL_FILE_SIGNATURE,
    )
  );
}

function exceedsCompressionRatio(
  compressedBytes: number,
  uncompressedBytes: number,
  maxCompressionRatio: number,
) {
  if (uncompressedBytes === 0) {
    return false;
  }

  if (compressedBytes <= 0) {
    return true;
  }

  return uncompressedBytes / compressedBytes > maxCompressionRatio;
}

function toArchiveError(message: string) {
  return new ZipArchiveValidationError(message);
}

async function yieldToEventLoopEvery(chunkCount: number) {
  if (chunkCount % DEFAULT_EVENT_LOOP_YIELD_INTERVAL === 0) {
    await waitForNextTick();
  }
}

function toBufferChunk(chunk: Buffer | Uint8Array | string) {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }

  if (typeof chunk === 'string') {
    return Buffer.from(chunk);
  }

  return Buffer.from(chunk);
}

async function pushArchiveFromSource(
  unzip: Unzip,
  source: AsyncIterable<Buffer | Uint8Array | string>,
  options: ZipArchiveReadOptions,
  getAbortError: () => Error | null,
  onSourceChunk?: (chunk: Buffer) => void,
) {
  let chunkCount = 0;

  for await (const rawChunk of source) {
    const abortError = getAbortError();

    if (abortError) {
      throw abortError;
    }

    const chunk = toBufferChunk(rawChunk);

    if (chunk.length === 0) {
      continue;
    }

    onSourceChunk?.(chunk);

    if (options.onChunk) {
      await options.onChunk(chunk);
    }

    unzip.push(chunk, false);
    chunkCount += 1;
    await yieldToEventLoopEvery(chunkCount);
  }

  unzip.push(Buffer.alloc(0), true);
}

export async function readZipArchiveFromSource(
  source: AsyncIterable<Buffer | Uint8Array | string>,
  options: ZipArchiveReadOptions = {},
): Promise<ZipArchiveEntry[]> {
  const allowedEntryNames = options.allowedEntryNames
    ? new Set(options.allowedEntryNames.map((entryName) => normalizeEntryName(entryName)))
    : null;
  const maxTotalUncompressedBytes =
    options.maxTotalUncompressedBytes ??
    DEFAULT_BACKUP_IMPORT_MAX_UNCOMPRESSED_BYTES;
  const maxEntries =
    options.maxEntries ?? DEFAULT_BACKUP_IMPORT_MAX_ENTRY_COUNT;
  const maxEntryBytes =
    options.maxEntryBytes ?? DEFAULT_BACKUP_IMPORT_MAX_ENTRY_BYTES;
  const maxCompressionRatio =
    options.maxCompressionRatio ??
    DEFAULT_BACKUP_IMPORT_MAX_COMPRESSION_RATIO;
  const shouldBlockNestedZip = options.blockNestedZip ?? true;
  const extractedEntries = new Map<string, Buffer>();
  const activeFiles = new Set<UnzipFile>();
  const entryPromises: Promise<void>[] = [];
  const metadataReader = new ZipLocalFileMetadataReader();
  let archiveError: Error | null = null;
  let entryCount = 0;
  let declaredTotalUncompressedBytes = 0;
  let streamedTotalUncompressedBytes = 0;

  const abortArchive = (error: Error) => {
    if (!archiveError) {
      archiveError = error;

      for (const activeFile of activeFiles) {
        try {
          activeFile.terminate();
        } catch {
          // Ignore secondary termination failures during abort.
        }
      }
    }

    return archiveError;
  };

  const unzip = new Unzip((file) => {
    if (archiveError) {
      file.terminate();
      throw archiveError;
    }

    entryCount += 1;

    if (entryCount > maxEntries) {
      throw abortArchive(
        toArchiveError(`Arquivo ZIP excede o limite de ${maxEntries} arquivos.`),
      );
    }

    const entryName = normalizeEntryName(file.name);

    if (isUnsafeEntryName(entryName)) {
      throw abortArchive(
        toArchiveError(`Entrada ZIP invalida ou insegura: ${entryName}.`),
      );
    }

    if (shouldBlockNestedZip && entryName.toLowerCase().endsWith('.zip')) {
      throw abortArchive(
        toArchiveError(
          `Arquivos ZIP aninhados nao sao permitidos: ${entryName}.`,
        ),
      );
    }

    if (allowedEntryNames && !allowedEntryNames.has(entryName)) {
      throw abortArchive(
        toArchiveError(`Arquivo inesperado no ZIP: ${entryName}.`),
      );
    }

    if (extractedEntries.has(entryName)) {
      throw abortArchive(
        toArchiveError(`Entrada duplicada no ZIP: ${entryName}.`),
      );
    }

    if (file.size === undefined || file.originalSize === undefined) {
      throw abortArchive(
        toArchiveError(
          `A entrada ${entryName} nao informa tamanhos obrigatorios.`,
        ),
      );
    }

    if (file.size < 0 || file.originalSize < 0) {
      throw abortArchive(
        toArchiveError(`A entrada ${entryName} possui tamanhos invalidos.`),
      );
    }

    if (file.originalSize > maxEntryBytes) {
      throw abortArchive(
        toArchiveError(
          `A entrada ${entryName} excede o limite de ${maxEntryBytes} bytes.`,
        ),
      );
    }

    declaredTotalUncompressedBytes += file.originalSize;

    if (declaredTotalUncompressedBytes > maxTotalUncompressedBytes) {
      throw abortArchive(
        toArchiveError(
          `Arquivo ZIP excede o limite total de ${maxTotalUncompressedBytes} bytes descompactados.`,
        ),
      );
    }

    if (
      exceedsCompressionRatio(
        file.size,
        file.originalSize,
        maxCompressionRatio,
      )
    ) {
      throw abortArchive(
        toArchiveError(
          `A entrada ${entryName} excede a taxa de compressao permitida.`,
        ),
      );
    }

    if (file.compression !== 0 && file.compression !== 8) {
      throw abortArchive(
        toArchiveError('Metodo de compressao ZIP nao suportado.'),
      );
    }

    let entryBytes = 0;
    const entryChecksum = createCrc32Accumulator();
    const chunks: Buffer[] = [];
    let expectedCrc32 = 0;

    try {
      expectedCrc32 = metadataReader.consumeEntryMetadata(entryName).expectedCrc32;
    } catch (error) {
      throw abortArchive(
        error instanceof Error
          ? error
          : toArchiveError(
              `Metadados de integridade ausentes para a entrada ${entryName}.`,
            ),
      );
    }

    const entryPromise = new Promise<void>((resolve, reject) => {
      file.ondata = (error, data, final) => {
        if (archiveError) {
          activeFiles.delete(file);
          reject(archiveError);
          return;
        }

        if (error) {
          activeFiles.delete(file);
          reject(
            abortArchive(
              toArchiveError(`Falha ao extrair a entrada ${entryName}.`),
            ),
          );
          return;
        }

        if (data.length > 0) {
          const chunk = Buffer.from(data);

          if (shouldBlockNestedZip && hasNestedZipSignature(chunk)) {
            activeFiles.delete(file);
            reject(
              abortArchive(
                toArchiveError(
                  `Arquivos ZIP aninhados nao sao permitidos: ${entryName}.`,
                ),
              ),
            );
            return;
          }

          entryBytes += chunk.length;
          streamedTotalUncompressedBytes += chunk.length;
          entryChecksum.update(chunk);

          if (entryBytes > maxEntryBytes) {
            activeFiles.delete(file);
            reject(
              abortArchive(
                toArchiveError(
                  `A entrada ${entryName} excede o limite de ${maxEntryBytes} bytes.`,
                ),
              ),
            );
            return;
          }

          if (streamedTotalUncompressedBytes > maxTotalUncompressedBytes) {
            activeFiles.delete(file);
            reject(
              abortArchive(
                toArchiveError(
                  `Arquivo ZIP excede o limite total de ${maxTotalUncompressedBytes} bytes descompactados.`,
                ),
              ),
            );
            return;
          }

          chunks.push(chunk);
        }

        if (!final) {
          return;
        }

        activeFiles.delete(file);

        if (entryBytes !== file.originalSize) {
          reject(
            abortArchive(
              toArchiveError(`Tamanho invalido para a entrada ${entryName}.`),
            ),
          );
          return;
        }

        if (entryChecksum.digest() !== expectedCrc32) {
          reject(
            abortArchive(
              toArchiveError(`Checksum invalido para a entrada ${entryName}.`),
            ),
          );
          return;
        }

        extractedEntries.set(entryName, Buffer.concat(chunks, entryBytes));
        resolve();
      };

      try {
        activeFiles.add(file);
        file.start();
      } catch {
        activeFiles.delete(file);
        reject(
          abortArchive(
            toArchiveError(
              `Nao foi possivel iniciar a leitura da entrada ${entryName}.`,
            ),
          ),
        );
      }
    });

    entryPromises.push(entryPromise);
  });

  unzip.register(AsyncUnzipInflate);

  try {
    await pushArchiveFromSource(
      unzip,
      source,
      options,
      () => archiveError,
      (chunk) => {
        metadataReader.pushChunk(chunk);
      },
    );
    await Promise.all(entryPromises);
  } catch (error) {
    if (error instanceof Error) {
      throw abortArchive(error);
    }

    throw abortArchive(toArchiveError('Falha ao ler o arquivo ZIP.'));
  }

  if (archiveError) {
    throw archiveError;
  }

  return Array.from(extractedEntries.entries()).map(([name, content]) => ({
    name,
    content,
  }));
}

export async function readZipArchive(
  archiveBuffer: Buffer,
  options: ZipArchiveReadOptions = {},
): Promise<ZipArchiveEntry[]> {
  const chunkSizeBytes = options.chunkSizeBytes ?? DEFAULT_CHUNK_SIZE_BYTES;
  const source = Readable.from(
    (function* chunkBuffer() {
      for (let offset = 0; offset < archiveBuffer.length; offset += chunkSizeBytes) {
        const end = Math.min(offset + chunkSizeBytes, archiveBuffer.length);
        yield archiveBuffer.subarray(offset, end);
      }
    })(),
  );

  return readZipArchiveFromSource(source, options);
}
