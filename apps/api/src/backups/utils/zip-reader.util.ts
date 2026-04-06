import { AsyncUnzipInflate, Unzip, type UnzipFile } from 'fflate';
import { Readable } from 'node:stream';
import { setImmediate as waitForNextTick } from 'node:timers/promises';
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

const DEFAULT_CHUNK_SIZE_BYTES = 64 * 1024;
const DEFAULT_EVENT_LOOP_YIELD_INTERVAL = 16;
const ZIP_LOCAL_FILE_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

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
  return new Error(message);
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
    const chunks: Buffer[] = [];

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
    await pushArchiveFromSource(unzip, source, options, () => archiveError);
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
