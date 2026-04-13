jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-42d3-a456-426614174000'),
}));

jest.mock('sharp', () =>
  jest.fn(() => ({
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  })),
);

import { EventEmitter2 } from '@nestjs/event-emitter';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let storageProviderMock: {
    upload: jest.Mock;
  };
  let eventEmitterMock: {
    emit: jest.Mock;
  };

  beforeEach(() => {
    storageProviderMock = {
      upload: jest.fn().mockResolvedValue({
        url: 'https://cdn.example.com/users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
        key: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      }),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    service = new UploadService(
      storageProviderMock as any,
      eventEmitterMock as unknown as EventEmitter2,
    );
  });

  it('stores ride uploads in a user-scoped path', async () => {
    const file = {
      originalname: 'ride.png',
      size: 8,
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]),
    } as Express.Multer.File;

    const result = await service.uploadImage(file, 'user-1', 'rides');

    expect(storageProviderMock.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        mimetype: 'image/webp',
        originalname: 'ride.png',
      }),
      'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      { cacheControl: 'public, max-age=31536000, immutable' },
    );
    expect(eventEmitterMock.emit).toHaveBeenCalledWith(
      'image.uploaded',
      expect.objectContaining({
        key: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      }),
    );
    expect(result).toEqual({
      url: 'https://cdn.example.com/users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      key: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    });
  });
});
