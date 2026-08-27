interface PrintMarkupOptions {
  title: string;
  fontFamily: string;
  widthMm: number;
  heightMm: number;
  localStyles: string;
  innerHtml: string;
}

export const createRasterPagesHtml = (pageDataUrls: string[]): string =>
  pageDataUrls
    .map(
      (dataUrl, index) => `
        <div class="print-single-page" data-page-number="${index + 1}">
          <img class="print-page-image" src="${dataUrl}" alt="Halaman ${index + 1}">
        </div>`,
    )
    .join('');

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character] ?? character;
  });

export const createPrintMarkup = ({
  title,
  fontFamily,
  widthMm,
  heightMm,
  localStyles,
  innerHtml,
}: PrintMarkupOptions): string => {
  const safeTitle = escapeHtml(title || 'Dokumen Kolase Foto');
  const safeFont = (fontFamily || 'Arial').replace(/[^a-zA-Z0-9 ,_-]/g, '');

  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${safeTitle}</title>
        <style>
          ${localStyles}
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100%;
            font-family: '${safeFont}', Arial, sans-serif;
          }
          .print-single-page {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            page-break-after: always;
            break-after: page;
            position: relative !important;
            overflow: hidden !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-single-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .print-page-image {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: fill;
          }
          @media screen {
            body {
              background: #475569 !important;
              padding: 8mm 0 !important;
            }
            .print-single-page {
              margin: 0 auto 8mm !important;
              box-shadow: 0 12px 32px rgba(15, 23, 42, 0.35);
            }
          }
          @media print {
            body { background: #ffffff !important; }
          }
        </style>
      </head>
      <body><div id="print-wrapper">${innerHtml}</div></body>
    </html>
  `;
};
