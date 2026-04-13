import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RidePhotoReferenceService } from './ride-photo-reference.service';

describe('RidePhotoReferenceService', () => {
  let service: RidePhotoReferenceService;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('https://cdn.example.com'),
    } as unknown as ConfigService;

    service = new RidePhotoReferenceService(configService);
  });

  it('accepts a rides upload reference for the same user', () => {
    const photo = service.validateForCreate(
      'user-1',
      'https://cdn.example.com/users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    );

    expect(photo).toBe(
      'https://cdn.example.com/users/user-1/rides/123e4567-e89b-42d3-a456-426614174000.webp',
    );
  });

  it('rejects an external photo URL', () => {
    expect(() =>
      service.validateForCreate(
        'user-1',
        'https://attacker.example.com/malicious.webp',
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects a rides upload reference from another user', () => {
    expect(() =>
      service.validateForCreate(
        'user-1',
        'https://cdn.example.com/users/user-2/rides/123e4567-e89b-42d3-a456-426614174000.webp',
      ),
    ).toThrow(BadRequestException);
  });

  it('allows a legacy photo to remain unchanged during update', () => {
    const legacyPhoto = 'https://legacy.example.com/photo.jpg';

    expect(
      service.validateForUpdate('user-1', legacyPhoto, legacyPhoto),
    ).toBe(legacyPhoto);
  });
});
