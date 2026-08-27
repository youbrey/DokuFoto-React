import {
  Document,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  TextWrappingType,
  VerticalPositionAlign,
  VerticalPositionRelativeFrom,
  convertMillimetersToTwip,
} from 'docx';
import saveAs from 'file-saver';
import type { DocumentProject } from '../types';
import { getDocumentGeometry } from './pageVisual';
import {
  renderProjectPagesToPng,
  type RenderedDocumentPage,
} from './pageRender';

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const encoded = dataUrl.split(',')[1];
  if (!encoded) throw new Error('Data gambar halaman tidak valid.');

  const binary = globalThis.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

/**
 * Membuat DOCX WYSIWYG: satu gambar PNG 300 DPI memenuhi setiap halaman Word.
 * renderedPages hanya disediakan oleh pengujian; aplikasi selalu merender host kanvas resmi.
 */
export async function createProjectDocxBlob(
  project: DocumentProject,
  renderedPages?: RenderedDocumentPage[],
): Promise<Blob> {
  const geometry = getDocumentGeometry(project);
  const pages =
    renderedPages || (await renderProjectPagesToPng(project, { colorMode: 'color', dpi: 300 }));

  if (pages.length !== project.pages.length) {
    throw new Error('Jumlah gambar hasil render tidak sesuai dengan jumlah halaman proyek.');
  }

  // docx memakai pixel 96 DPI untuk ukuran tampilan, sedangkan data PNG tetap 300 DPI.
  const displayWidthPx = (geometry.widthMm / 25.4) * 96;
  const displayHeightPx = (geometry.heightMm / 25.4) * 96;

  const sections = pages.map((page, pageIndex) => ({
    properties: {
      page: {
        size: {
          width: convertMillimetersToTwip(geometry.widthMm),
          height: convertMillimetersToTwip(geometry.heightMm),
          orientation: project.orientation,
        },
        margin: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          header: 0,
          footer: 0,
          gutter: 0,
        },
      },
    },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0, line: 1 },
        children: [
          new ImageRun({
            data: dataUrlToBytes(page.dataUrl),
            type: 'png',
            transformation: {
              width: displayWidthPx,
              height: displayHeightPx,
            },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.LEFT,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.TOP,
              },
              wrap: { type: TextWrappingType.NONE },
              allowOverlap: true,
              behindDocument: false,
              layoutInCell: false,
            },
            altText: {
              title: `Halaman ${pageIndex + 1}`,
              description: 'Hasil WYSIWYG Setwan DokuFoto',
              name: `dokufoto-${page.pageId}`,
            },
          }),
        ],
      }),
    ],
  }));

  const document = new Document({
    creator: project.author || 'Sekretariat DPRD Kota Bitung',
    title: project.title,
    description: 'Dokumentasi WYSIWYG Setwan DokuFoto',
    sections,
  });

  return Packer.toBlob(document);
}

export async function exportProjectToDocx(project: DocumentProject): Promise<void> {
  const blob = await createProjectDocxBlob(project);
  const safeFilename = `${project.title
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40)}_SetwanDokuFoto.docx`;
  saveAs(blob, safeFilename);
}
