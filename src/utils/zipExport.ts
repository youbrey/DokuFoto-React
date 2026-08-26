import JSZip from 'jszip';
import saveAs from 'file-saver';
import { DocumentProject, PhotoMetadata } from '../types';

export async function exportProjectArchiveZip(
  project: DocumentProject,
  photos: PhotoMetadata[]
): Promise<void> {
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

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Arsip.zip`);
}

