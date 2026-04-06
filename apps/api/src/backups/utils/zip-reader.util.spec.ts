import { readZipArchive } from './zip-reader.util';
import { createZipArchive } from './zip-builder.util';

describe('readZipArchive', () => {
  it('should extract expected entries with asynchronous ZIP streaming', async () => {
    const archiveBuffer = createZipArchive([
      { name: 'manifest.json', content: '{"ok":true}' },
      { name: 'clients.json', content: '[]' },
    ]);

    const entries = await readZipArchive(archiveBuffer, {
      allowedEntryNames: ['manifest.json', 'clients.json'],
      maxEntries: 2,
      maxEntryBytes: 1024,
      maxTotalUncompressedBytes: 2048,
    });

    expect(entries).toEqual([
      expect.objectContaining({
        name: 'manifest.json',
        content: Buffer.from('{"ok":true}'),
      }),
      expect.objectContaining({
        name: 'clients.json',
        content: Buffer.from('[]'),
      }),
    ]);
  });

  it('should reject anomalous compression ratios before extraction completes', async () => {
    const archiveBuffer = createZipArchive([
      { name: 'manifest.json', content: 'A'.repeat(1024 * 1024) },
    ]);

    await expect(
      readZipArchive(archiveBuffer, {
        allowedEntryNames: ['manifest.json'],
        maxCompressionRatio: 10,
        maxEntries: 1,
        maxEntryBytes: 2 * 1024 * 1024,
        maxTotalUncompressedBytes: 2 * 1024 * 1024,
      }),
    ).rejects.toThrow('taxa de compressao permitida');
  });

  it('should reject nested ZIP entries', async () => {
    const archiveBuffer = createZipArchive([
      { name: 'nested.zip', content: Buffer.from('PK\x03\x04payload') },
    ]);

    await expect(
      readZipArchive(archiveBuffer, {
        maxEntries: 1,
        maxEntryBytes: 1024,
        maxTotalUncompressedBytes: 1024,
      }),
    ).rejects.toThrow('ZIP aninhados');
  });

  it('should reject archives that exceed the maximum entry count', async () => {
    const archiveBuffer = createZipArchive([
      { name: 'file-1.json', content: '{}' },
      { name: 'file-2.json', content: '{}' },
    ]);

    await expect(
      readZipArchive(archiveBuffer, {
        maxEntries: 1,
        maxEntryBytes: 1024,
        maxTotalUncompressedBytes: 2048,
      }),
    ).rejects.toThrow('limite de 1 arquivos');
  });
});
