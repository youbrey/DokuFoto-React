import { toPng } from 'html-to-image';
import type { DocumentProject } from '../types';
import { getDocumentGeometry } from './pageVisual';

export interface RenderedDocumentPage {
  pageId: string;
  dataUrl: string;
  widthPx: number;
  heightPx: number;
}

export const OUTPUT_DPI = 300;

export const getOutputPageElementId = (pageId: string): string =>
  `dokufoto-output-page-${pageId}`;

const waitForElementAssets = async (element: HTMLElement): Promise<void> => {
  if (document.fonts?.ready) await document.fonts.ready;

  await Promise.all(
    Array.from(element.querySelectorAll('img')).map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      try {
        await image.decode();
      } catch {
        await new Promise<void>((resolve) => {
          const finish = () => resolve();
          image.addEventListener('load', finish, { once: true });
          image.addEventListener('error', finish, { once: true });
          window.setTimeout(finish, 10_000);
        });
      }
    }),
  );
};

export const renderProjectPagesToPng = async (
  project: DocumentProject,
  options: { colorMode?: 'color' | 'mono'; dpi?: number } = {},
): Promise<RenderedDocumentPage[]> => {
  const geometry = getDocumentGeometry(project);
  const dpi = options.dpi || OUTPUT_DPI;
  const widthPx = Math.round((geometry.widthMm / 25.4) * dpi);
  const heightPx = Math.round((geometry.heightMm / 25.4) * dpi);
  const pixelRatio = widthPx / geometry.baseCanvasWidth;
  const rendered: RenderedDocumentPage[] = [];

  for (const page of project.pages) {
    const element = document.getElementById(getOutputPageElementId(page.id));
    if (!(element instanceof HTMLElement)) {
      throw new Error(`Renderer halaman ${page.pageNumber} belum siap.`);
    }

    await waitForElementAssets(element);
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      cacheBust: false,
      pixelRatio,
      width: geometry.baseCanvasWidth,
      height: geometry.baseCanvasHeight,
      style:
        options.colorMode === 'mono'
          ? { filter: 'grayscale(1) contrast(1.25)' }
          : undefined,
    });

    rendered.push({ pageId: page.id, dataUrl, widthPx, heightPx });
  }

  return rendered;
};
