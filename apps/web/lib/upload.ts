import { isAxiosError } from 'axios';
import { apiClient } from '@/services/api';
import { getUploadImageValidationError } from '@/lib/upload-image';

export async function uploadImage(
  file: File,
  folder: string = 'images',
): Promise<{ key: string; url?: string }> {
  const validationError = getUploadImageValidationError(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    return await apiClient.post<{ key: string; url?: string }>(
      '/upload/image',
      formData,
      {
        params: { folder },
      },
    );
  } catch (error) {
    if (isAxiosError(error)) {
      const message =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : undefined;

      throw new Error(message || 'Falha ao realizar o upload da imagem');
    }

    throw error;
  }
}
