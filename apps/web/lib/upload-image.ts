const UPLOAD_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const UPLOAD_IMAGE_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const UPLOAD_IMAGE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export const UPLOAD_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

type UploadImageMimeType = (typeof UPLOAD_IMAGE_ALLOWED_MIME_TYPES)[number];
type UploadImageExtension = (typeof UPLOAD_IMAGE_ALLOWED_EXTENSIONS)[number];

const allowedMimeTypeSet = new Set<UploadImageMimeType>(
  UPLOAD_IMAGE_ALLOWED_MIME_TYPES,
);
const allowedExtensionSet = new Set<UploadImageExtension>(
  UPLOAD_IMAGE_ALLOWED_EXTENSIONS,
);

function getFileExtension(filename: string) {
  const extensionIndex = filename.lastIndexOf('.');

  if (extensionIndex < 0) {
    return '';
  }

  return filename.slice(extensionIndex).toLowerCase();
}

export function getUploadImageValidationError(file: File): string | undefined {
  const hasAllowedMimeType = allowedMimeTypeSet.has(
    file.type as UploadImageMimeType,
  );
  const hasAllowedExtension = allowedExtensionSet.has(
    getFileExtension(file.name) as UploadImageExtension,
  );

  if (!hasAllowedMimeType && !hasAllowedExtension) {
    return 'Envie apenas imagens JPG, PNG ou WEBP.';
  }

  if (file.size > UPLOAD_IMAGE_MAX_SIZE_BYTES) {
    return 'A imagem deve ter no maximo 5 MB.';
  }

  return undefined;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Nao foi possivel ler a imagem selecionada.'));
    };

    reader.onerror = () => {
      reject(new Error('Nao foi possivel ler a imagem selecionada.'));
    };

    reader.readAsDataURL(file);
  });
}
