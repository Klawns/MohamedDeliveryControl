const metadataMock = jest.fn();
const toBufferMock = jest.fn();

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-42d3-a456-426614174000'),
}));

jest.mock('sharp', () =>
  jest.fn(() => ({
    metadata: metadataMock,
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: toBufferMock,
  })),
);

import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let storageProviderMock: {
    upload: jest.Mock;
    uploadPrivate: jest.Mock;
  };
  let eventEmitterMock: {
    emit: jest.Mock;
  };

  beforeEach(() => {
    metadataMock.mockReset();
    metadataMock.mockResolvedValue({ format: 'png' });
    toBufferMock.mockReset();
    toBufferMock.mockResolvedValue(Buffer.from('processed-image'));

    storageProviderMock = {
      upload: jest.fn().mockResolvedValue({
        url: 'https://cdn.example.com/users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
        key: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      }),
      uploadPrivate: jest.fn().mockResolvedValue({
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

    expect(storageProviderMock.uploadPrivate).toHaveBeenCalledWith(
      expect.objectContaining({
        mimetype: 'image/webp',
        originalname: 'ride.png',
      }),
      'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      { cacheControl: 'private, no-store', contentDisposition: 'inline' },
    );
    expect(eventEmitterMock.emit).toHaveBeenCalledWith(
      'image.uploaded',
      expect.objectContaining({
        key: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      }),
    );
    expect(result).toEqual({
      key: 'users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    });
  });

  it('rejects files with an unsupported original extension', async () => {
    const file = {
      originalname: 'ride.gif',
      size: 8,
      buffer: Buffer.from([0x47, 0x49, 0x46, 0x38]),
    } as Express.Multer.File;

    await expect(service.uploadImage(file, 'user-1', 'rides')).rejects.toThrow(
      new BadRequestException(
        'Arquivo invalido. Envie apenas imagens JPG, PNG ou WEBP.',
      ),
    );
    expect(storageProviderMock.uploadPrivate).not.toHaveBeenCalled();
  });

  it('rejects files whose decoded content is not a supported image', async () => {
    metadataMock.mockResolvedValueOnce({ format: 'gif' });
    const file = {
      originalname: 'ride.png',
      size: 8,
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    } as Express.Multer.File;

    await expect(service.uploadImage(file, 'user-1', 'rides')).rejects.toThrow(
      new BadRequestException(
        'Arquivo invalido. O conteudo nao e uma imagem suportada (JPG, PNG ou WEBP).',
      ),
    );
    expect(storageProviderMock.uploadPrivate).not.toHaveBeenCalled();
  });
});
