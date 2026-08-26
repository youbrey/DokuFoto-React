import type { PhotoMetadata } from '../types';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
export const MAX_IMAGE_SIZE_BYTES = 30 * 1024 * 1024;

export const isSupportedImageFile = (file: File): boolean =>
  ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]) ||
  ACCEPTED_IMAGE_EXTENSIONS.test(file.name);

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error(`Gagal membaca ${file.name}.`));
    reader.onerror = () => reject(reader.error ?? new Error(`Gagal membaca ${file.name}.`));
    reader.onabort = () => reject(new Error(`Pembacaan ${file.name} dibatalkan.`));
    reader.readAsDataURL(file);
  });

export const readImageFile = async (
  file: File,
  category = 'Dokumentasi Lapangan',
): Promise<PhotoMetadata> => {
  if (!isSupportedImageFile(file)) {
    throw new Error(`${file.name}: format tidak didukung. Gunakan JPG, PNG, atau WEBP.`);
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`${file.name}: ukuran melebihi batas 30 MB.`);
  }

  return {
    id: `photo-${Date.now()}-${crypto.randomUUID()}`,
    name: file.name,
    dataUrl: await fileToDataUrl(file),
    sizeBytes: file.size,
    capturedDate: new Date(file.lastModified || Date.now()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    category,
  };
};

export const readImageFiles = async (
  files: FileList | File[],
  category?: string,
): Promise<{ photos: PhotoMetadata[]; errors: string[] }> => {
  const candidates = Array.from(files);
  const results = await Promise.allSettled(
    candidates.map((file) => readImageFile(file, category)),
  );

  const photos: PhotoMetadata[] = [];
  const errors: string[] = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') photos.push(result.value);
    else errors.push(result.reason instanceof Error ? result.reason.message : 'Foto gagal dibaca.');
  });
  return { photos, errors };
};
