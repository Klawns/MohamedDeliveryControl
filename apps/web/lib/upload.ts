export async function uploadImage(
  file: File,
  folder: string = "images",
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`/api/upload/image?folder=${folder}`, {
    method: "POST",
    body: formData,
    credentials: "include",
    // Note: ao usar FormData com fetch, nao defina o Content-Type.
    // O browser define o multipart/form-data com o boundary correto.
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Falha ao realizar o upload da imagem");
  }

  return response.json();
}
