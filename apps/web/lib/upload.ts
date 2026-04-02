import { isAxiosError } from 'axios';
import { apiClient } from '@/services/api';

export async function uploadImage(
  file: File,
  folder: string = "images",
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    return await apiClient.post<{ url: string; key: string }>(
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
