import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  convertMillimetersToTwip,
  PageBreak,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import saveAs from 'file-saver';
import { DocumentProject, DocumentPage, CollageCell } from '../types';
import { PAPER_DIMENSIONS } from './constants';

// Convert an image URL / base64 / SVG to a Uint8Array PNG for docx ImageRun
async function imageUrlToBuffer(url: string): Promise<Uint8Array | null> {
  try {
    if (!url) return null;

    // Handle SVG data URL or inline SVG: draw to canvas and get PNG
    if (url.startsWith('data:image/svg+xml') || url.includes('<svg')) {
      const img = new Image();
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = url;
      });

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngDataUrl = canvas.toDataURL('image/png');
      const base64Data = pngDataUrl.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    if (url.startsWith('data:image/')) {
      const base64Data = url.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    // DokuFoto berjalan offline; URL jaringan lama tidak diunduh saat ekspor.
    console.warn('Gambar eksternal dilewati. Impor ulang gambar dari disk agar tersedia offline.');
    return null;
  } catch (error) {
    console.warn('Failed to load image for docx export:', error);
    return null;
  }
}

export async function exportProjectToDocx(project: DocumentProject): Promise<void> {
  const paperInfo = PAPER_DIMENSIONS[project.paperSize] || PAPER_DIMENSIONS.F4;
  const isLandscape = project.orientation === 'landscape';

  const pageWidthMm = isLandscape ? paperInfo.heightMm : paperInfo.widthMm;
  const pageHeightMm = isLandscape ? paperInfo.widthMm : paperInfo.heightMm;

  // Margin in twips
  const topTwips = convertMillimetersToTwip(project.margins.top * 10);
  const bottomTwips = convertMillimetersToTwip(project.margins.bottom * 10);
  const leftTwips = convertMillimetersToTwip(project.margins.left * 10);
  const rightTwips = convertMillimetersToTwip(project.margins.right * 10);

  const usableWidthMm = pageWidthMm - (project.margins.left * 10 + project.margins.right * 10);

  const sections = [];

  for (let pIndex = 0; pIndex < project.pages.length; pIndex++) {
    const page = project.pages[pIndex];
    const children: (Paragraph | Table)[] = [];

    // 1. Judul Dokumen / Laporan (Modular)
    if (page.showTitle !== false && page.title) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: page.title.toUpperCase(),
              font: project.fontFamily,
              size: 26, // 13pt
              bold: true,
            }),
          ],
        })
      );
    }

    if (page.showTitle !== false && page.subtitle) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: page.subtitle,
              font: project.fontFamily,
              size: 22, // 11pt
              bold: true,
              italics: true,
            }),
          ],
        })
      );
    }

    // 3. Tabel Meta Data Kegiatan (Tanggal, Lokasi, Peserta)
    if (page.showMetaTable !== false && page.metaTable && page.metaTable.length > 0) {
      const metaRows = page.metaTable.map(
        (meta) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: meta.label,
                        font: project.fontFamily,
                        size: 20, // 10pt
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 5, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: ':',
                        font: project.fontFamily,
                        size: 20,
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: meta.value,
                        font: project.fontFamily,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      );

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: metaRows,
        })
      );

      children.push(new Paragraph({ spacing: { after: 140 } }));
    }

    // 4. Floating Text Elements (Canva-style rich text boxes)
    if (page.floatingTexts && page.floatingTexts.length > 0) {
      page.floatingTexts.forEach((ft) => {
        if (!ft.text) return;
        const alignType =
          ft.textAlign === 'center'
            ? AlignmentType.CENTER
            : ft.textAlign === 'right'
            ? AlignmentType.RIGHT
            : AlignmentType.LEFT;

        children.push(
          new Paragraph({
            alignment: alignType,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: ft.text,
                font: ft.fontFamily || project.fontFamily,
                size: Math.max(16, Math.round(ft.fontSize * 1.5)),
                bold: ft.fontWeight === 'bold' || ft.fontWeight === '900',
                italics: ft.fontStyle === 'italic',
                underline: ft.textDecoration === 'underline' ? {} : undefined,
                color: ft.color ? ft.color.replace('#', '') : undefined,
              }),
            ],
          })
        );
      });
    }

    // 5. Deskripsi Kegiatan Singkat (Modular)
    if (page.showDescription && page.activityDescription) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: page.activityDescription,
              font: project.fontFamily,
              size: 20, // 10pt
            }),
          ],
        })
      );
    }

    // 5. Grid Kolase Foto
    const activeCells =
      page.grids && page.grids.length > 0
        ? page.grids.flatMap((g) => g.cells)
        : page.cells;

    const rowsMap = new Map<number, CollageCell[]>();
    activeCells.forEach((cell) => {
      if (!rowsMap.has(cell.row)) {
        rowsMap.set(cell.row, []);
      }
      rowsMap.get(cell.row)!.push(cell);
    });

    const sortedRowIndices = Array.from(rowsMap.keys()).sort((a, b) => a - b);
    const tableRows: TableRow[] = [];

    // Calculate cell widths based on column counts
    for (const rIndex of sortedRowIndices) {
      const rowCells = rowsMap.get(rIndex)!.sort((a, b) => a.col - b.col);
      const colCount = rowCells.length;
      const cellWidthPercentage = 100 / Math.max(1, colCount);

      const tableCellNodes: TableCell[] = [];

      for (const cell of rowCells) {
        const cellChildren: Paragraph[] = [];

        if (cell.photo && cell.photo.dataUrl) {
          const imgBytes = await imageUrlToBuffer(cell.photo.dataUrl);
          if (imgBytes) {
            // Calculate proportional image dimensions for docx
            const approxWidthPx = colCount === 1 ? 480 : colCount === 2 ? 240 : 160;
            const approxHeightPx = Math.round(approxWidthPx * 0.75); // 4:3 default ratio

            cellChildren.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new ImageRun({
                    data: imgBytes,
                    transformation: { width: approxWidthPx, height: approxHeightPx },
                    type: 'png',
                  }),
                ],
              })
            );
          }
        } else {
          // Placeholder box for empty cell
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({
                  text: '[ Slot Foto Kosong ]',
                  font: project.fontFamily,
                  size: 18,
                  color: '888888',
                  italics: true,
                }),
              ],
            })
          );
        }

        // Caption per foto
        if (cell.caption && (cell.showCaption !== false)) {
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 60 },
              children: [
                new TextRun({
                  text: cell.caption,
                  font: project.fontFamily,
                  size: 18, // 9pt
                  bold: true,
                }),
              ],
            })
          );
        }

        tableCellNodes.push(
          new TableCell({
            width: { size: cellWidthPercentage, type: WidthType.PERCENTAGE },
            margins: {
              top: convertMillimetersToTwip(2),
              bottom: convertMillimetersToTwip(2),
              left: convertMillimetersToTwip(2),
              right: convertMillimetersToTwip(2),
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            children: cellChildren,
          })
        );
      }

      tableRows.push(new TableRow({ children: tableCellNodes }));
    }

    if (tableRows.length > 0 && page.showCollageGrid !== false) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );
    }

    // 5b. Elemen Teks Bebas / Floating Texts
    if (page.floatingTexts && page.floatingTexts.length > 0) {
      for (const ft of page.floatingTexts) {
        const alignType =
          ft.textAlign === 'left'
            ? AlignmentType.LEFT
            : ft.textAlign === 'right'
            ? AlignmentType.RIGHT
            : ft.textAlign === 'justify'
            ? AlignmentType.JUSTIFIED
            : AlignmentType.CENTER;

        const cleanColor = (ft.color || '#000000').replace('#', '');

        children.push(
          new Paragraph({
            alignment: alignType,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                text: ft.text,
                font: ft.fontFamily || project.fontFamily,
                size: Math.max(16, Math.round(ft.fontSize * 2)), // half-points in docx
                bold: ft.fontWeight === 'bold' || ft.fontWeight === '900',
                italics: ft.fontStyle === 'italic',
                underline: ft.textDecoration === 'underline' ? {} : undefined,
                strike: ft.textDecoration === 'line-through',
                color: cleanColor.length === 6 ? cleanColor : '000000',
              }),
            ],
          })
        );
      }
    }

    // 6. Blok Tanda Tangan Resmi (Signature Block)
    if (page.signatureBlock && page.signatureBlock.enabled) {
      children.push(new Paragraph({ spacing: { before: 180 } }));

      const signatureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 55, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [new Paragraph({ text: '' })],
              }),
              new TableCell({
                width: { size: 45, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: page.signatureBlock.cityAndDate,
                        font: project.fontFamily,
                        size: 20,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: page.signatureBlock.roleTitle,
                        font: project.fontFamily,
                        size: 20,
                        bold: true,
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { before: 380, after: 0 },
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: page.signatureBlock.officerName,
                        font: project.fontFamily,
                        size: 20,
                        bold: true,
                        underline: {},
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: page.signatureBlock.nip,
                        font: project.fontFamily,
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      children.push(signatureTable);
    }

    sections.push({
      properties: {
        page: {
          size: {
            width: convertMillimetersToTwip(pageWidthMm),
            height: convertMillimetersToTwip(pageHeightMm),
            orientation: isLandscape ? ('landscape' as const) : ('portrait' as const),
          },
          margin: {
            top: topTwips,
            bottom: bottomTwips,
            left: leftTwips,
            right: rightTwips,
          },
        },
      },
      children,
    });
  }

  const doc = new Document({
    creator: project.author || 'Sekretariat DPRD Kota Bitung',
    title: project.title,
    description: 'Dokumentasi Foto Kegiatan Setwan DokuFoto',
    sections,
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40)}_SetwanDokuFoto.docx`;
  saveAs(blob, safeFilename);
}
