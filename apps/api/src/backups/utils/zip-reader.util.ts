import { inflateRawSync } from 'node:zlib';
import { crc32 } from './crc32.util';

export interface ZipArchiveEntry {
  name: string;
  content: Buffer;
}

export function readZipArchive(buffer: Buffer): ZipArchiveEntry[] {
  const entries: ZipArchiveEntry[] = [];
  let offset = 0;

  while (offset + 4 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);

    if (signature === 0x02014b50 || signature === 0x06054b50) {
      break;
    }

    if (signature !== 0x04034b50) {
      throw new Error('Arquivo ZIP invalido.');
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const expectedCrc = buffer.readUInt32LE(offset + 14);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > buffer.length) {
      throw new Error('Arquivo ZIP truncado.');
    }

    const name = buffer.subarray(nameStart, nameEnd).toString('utf8');
    const compressedContent = buffer.subarray(dataStart, dataEnd);

    let content: Buffer;

    if (compressionMethod === 0) {
      content = compressedContent;
    } else if (compressionMethod === 8) {
      content = inflateRawSync(compressedContent);
    } else {
      throw new Error('Metodo de compressao ZIP nao suportado.');
    }

    if (content.length !== uncompressedSize) {
      throw new Error(`Tamanho invalido para a entrada ${name}.`);
    }

    if (crc32(content) !== expectedCrc) {
      throw new Error(`Checksum ZIP invalido para a entrada ${name}.`);
    }

    entries.push({ name, content });
    offset = dataEnd;
  }

  return entries;
}
