import { PassThrough } from 'node:stream';
import { RcloneProcessService } from '../services/rclone-process.service';
import { RcloneDriveBackupStorageProvider } from './rclone-drive-backup-storage.provider';

describe('RcloneDriveBackupStorageProvider', () => {
  let processServiceMock: jest.Mocked<RcloneProcessService>;
  let provider: RcloneDriveBackupStorageProvider;

  beforeEach(() => {
    processServiceMock = {
      uploadBuffer: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue(new PassThrough()),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RcloneProcessService>;

    provider = new RcloneDriveBackupStorageProvider(processServiceMock);
  });

  it('uploads technical backup buffers and returns a typed storage reference', async () => {
    const result = await provider.upload(
      {
        buffer: Buffer.from('dump-content'),
        contentType: 'application/gzip',
        fileName: 'technical-backup.sql.gz',
      },
      'technical/manual/2026-04-17/job-1.sql.gz',
    );

    expect(processServiceMock.uploadBuffer).toHaveBeenCalledWith(
      Buffer.from('dump-content'),
      'technical/manual/2026-04-17/job-1.sql.gz',
    );
    expect(result).toEqual({
      providerId: 'rclone_drive',
      key: 'technical/manual/2026-04-17/job-1.sql.gz',
      fileName: 'technical-backup.sql.gz',
      contentType: 'application/gzip',
    });
  });
});
