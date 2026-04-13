import { extname } from 'node:path';

export const UPLOAD_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const UPLOAD_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const UPLOAD_IMAGE_ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;

export const UPLOAD_IMAGE_ALLOWED_FORMATS = ['jpeg', 'png', 'webp'] as const;

export const UPLOAD_IMAGE_FILE_TYPE_PATTERN = /^image\/(jpeg|png|webp)$/i;

type UploadImageMimeType = (typeof UPLOAD_IMAGE_ALLOWED_MIME_TYPES)[number];
type UploadImageExtension = (typeof UPLOAD_IMAGE_ALLOWED_EXTENSIONS)[number];
export type UploadImageFormat = (typeof UPLOAD_IMAGE_ALLOWED_FORMATS)[number];

const allowedMimeTypeSet = new Set<UploadImageMimeType>(
  UPLOAD_IMAGE_ALLOWED_MIME_TYPES,
);
const allowedExtensionSet = new Set<UploadImageExtension>(
  UPLOAD_IMAGE_ALLOWED_EXTENSIONS,
);
const allowedFormatSet = new Set<UploadImageFormat>(UPLOAD_IMAGE_ALLOWED_FORMATS);

export function isAllowedUploadImageMimeType(
  mimetype: string | undefined,
): mimetype is UploadImageMimeType {
  return allowedMimeTypeSet.has(mimetype as UploadImageMimeType);
}

export function hasAllowedUploadImageExtension(originalname: string): boolean {
  return allowedExtensionSet.has(
    extname(originalname).toLowerCase() as UploadImageExtension,
  );
}

export function isAllowedUploadImageFormat(
  format: string | undefined,
): format is UploadImageFormat {
  return allowedFormatSet.has(format as UploadImageFormat);
}
