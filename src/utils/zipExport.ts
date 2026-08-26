import saveAs from 'file-saver';
import { DocumentProject, PhotoMetadata } from '../types';
import { deduplicatePhotos, parseWorkspaceJson, type WorkspaceSnapshot } from './workspace';

export async function exportProjectArchiveZip(
  project: DocumentProject,
  photos: PhotoMetadata[]
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const folder = zip.folder(`SetwanDokuFoto_${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`) || zip;

  // 1. Save Project JSON
  folder.file('project.dokufoto.json', JSON.stringify(project, null, 2));

  // 2. Save Photos Gallery
  const photosFolder = folder.folder('media_foto');
  if (photosFolder) {
    photos.forEach((photo, idx) => {
      if (photo.dataUrl && photo.dataUrl.startsWith('data:image/')) {
        const parts = photo.dataUrl.split(';base64,');
        const mime = parts[0].replace('data:', '');
        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
        const base64Data = parts[1];
        photosFolder.file(`foto_${idx + 1}_${photo.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`, base64Data, {
          base64: true,
        });
      }
    });
  }

  // 3. Readme info
  folder.file(
    'INFORMASI_PROYEK.txt',
    `DOKUMENTASI FOTO SETWAN DPRD KOTA BITUNG
Judul: ${project.title}
Ukuran Kertas: ${project.paperSize} (${project.orientation})
Jumlah Halaman: ${project.pages.length}
Waktu Ekspor: ${new Date().toLocaleString('id-ID')}

Berkas ini adalah cadangan arsip proyek Setwan DokuFoto (React Vite).
Anda dapat membuka kembali file 'project.dokufoto.json' langsung di aplikasi.`
  );

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  saveAs(content, `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Arsip.zip`);
}

const getImageMimeType = (filename: string): string => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

export async function importProjectArchiveZip(file: File): Promise<WorkspaceSnapshot> {
  if (file.size > 512 * 1024 * 1024) {
    throw new Error('Arsip ZIP melebihi batas 512 MB. Kurangi jumlah atau ukuran foto.');
  }
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  if (Object.keys(zip.files).length > 2000) {
    throw new Error('Arsip ZIP berisi terlalu banyak berkas.');
  }
  const projectEntry = Object.values(zip.files).find(
    (entry) =>
      !entry.dir &&
      (entry.name === 'project.dokufoto.json' || entry.name.endsWith('/project.dokufoto.json')),
  );
  if (!projectEntry) {
    throw new Error('Arsip ZIP tidak berisi project.dokufoto.json.');
  }

  const workspace = parseWorkspaceJson(await projectEntry.async('string'));
  const imageEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && /\/media_foto\/.*\.(jpe?g|png|webp)$/i.test(entry.name),
  );
  const archivedPhotos = await Promise.all(
    imageEntries.map(async (entry) => {
      const filename = entry.name.split('/').pop() || 'foto-arsip.jpg';
      const base64 = await entry.async('base64');
      return {
        id: `photo-${crypto.randomUUID()}`,
        name: filename.replace(/^foto_\d+_/, ''),
        dataUrl: `data:${getImageMimeType(filename)};base64,${base64}`,
        category: 'Impor Arsip',
      } satisfies PhotoMetadata;
    }),
  );

  return {
    ...workspace,
    photos: deduplicatePhotos([...workspace.photos, ...archivedPhotos]),
  };
}
