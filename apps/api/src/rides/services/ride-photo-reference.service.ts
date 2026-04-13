import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RIDE_PHOTO_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class RidePhotoReferenceService {
  private readonly publicOrigin: string;
  private readonly publicBasePath: string;

  constructor(private readonly configService: ConfigService) {
    const publicUrl = new URL(
      this.configService.getOrThrow<string>('R2_PUBLIC_URL'),
    );

    this.publicOrigin = publicUrl.origin;
    this.publicBasePath =
      publicUrl.pathname === '/'
        ? ''
        : publicUrl.pathname.replace(/\/+$/, '');
  }

  validateForCreate(userId: string, photo?: string | null) {
    if (photo === undefined) {
      return undefined;
    }

    return this.validateControlledReference(userId, photo);
  }

  validateForUpdate(
    userId: string,
    nextPhoto: string | null | undefined,
    currentPhoto: string | null,
  ) {
    if (nextPhoto === undefined) {
      return undefined;
    }

    if (nextPhoto === currentPhoto) {
      return nextPhoto;
    }

    return this.validateControlledReference(userId, nextPhoto);
  }

  private validateControlledReference(userId: string, photo: string | null) {
    if (photo === null) {
      return null;
    }

    const normalizedPhoto = photo.trim();

    if (!normalizedPhoto) {
      return null;
    }

    let parsedPhoto: URL;

    try {
      parsedPhoto = new URL(normalizedPhoto);
    } catch {
      throw new BadRequestException(
        'Foto invalida. Envie apenas uma referencia gerada pelo upload de corridas.',
      );
    }

    if (parsedPhoto.origin !== this.publicOrigin) {
      throw new BadRequestException(
        'Foto invalida. Envie apenas uma referencia gerada pelo upload de corridas.',
      );
    }

    if (parsedPhoto.search || parsedPhoto.hash) {
      throw new BadRequestException(
        'Foto invalida. Envie apenas uma referencia gerada pelo upload de corridas.',
      );
    }

    const expectedPathPattern = new RegExp(
      `^${escapeRegex(`${this.publicBasePath}/users/${userId}/rides/`)}(.+)$`,
      'i',
    );
    const match = parsedPhoto.pathname.match(expectedPathPattern);

    if (!match || !RIDE_PHOTO_FILENAME_PATTERN.test(match[1])) {
      throw new BadRequestException(
        'Foto invalida. Envie apenas uma referencia gerada pelo upload de corridas.',
      );
    }

    return normalizedPhoto;
  }
}
