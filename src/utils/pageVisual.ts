import type React from 'react';
import type {
  CollageCell,
  CollageGridElement,
  DocumentPage,
  DocumentProject,
  FloatingTextElement,
} from '../types';
import { COLLAGE_LAYOUTS, PAPER_DIMENSIONS } from './constants';

export interface DocumentGeometry {
  widthMm: number;
  heightMm: number;
  baseCanvasWidth: number;
  baseCanvasHeight: number;
  padTopPx: number;
  padBottomPx: number;
  padLeftPx: number;
  padRightPx: number;
}

export const getDocumentGeometry = (project: DocumentProject): DocumentGeometry => {
  const preset = PAPER_DIMENSIONS[project.paperSize] || PAPER_DIMENSIONS.F4;
  const portraitWidthMm =
    project.paperSize === 'Custom' && project.customWidthMm
      ? project.customWidthMm
      : preset.widthMm;
  const portraitHeightMm =
    project.paperSize === 'Custom' && project.customHeightMm
      ? project.customHeightMm
      : preset.heightMm;
  const isLandscape = project.orientation === 'landscape';
  const widthMm = isLandscape ? portraitHeightMm : portraitWidthMm;
  const heightMm = isLandscape ? portraitWidthMm : portraitHeightMm;
  const aspectRatio = widthMm / heightMm;
  const baseCanvasWidth = isLandscape ? Math.round(560 * aspectRatio) : 560;
  const baseCanvasHeight = isLandscape ? 560 : Math.round(560 / aspectRatio);

  return {
    widthMm,
    heightMm,
    baseCanvasWidth,
    baseCanvasHeight,
    padTopPx: ((project.margins.top * 10) / heightMm) * baseCanvasHeight,
    padBottomPx: ((project.margins.bottom * 10) / heightMm) * baseCanvasHeight,
    padLeftPx: ((project.margins.left * 10) / widthMm) * baseCanvasWidth,
    padRightPx: ((project.margins.right * 10) / widthMm) * baseCanvasWidth,
  };
};

export const getPageGrids = (
  page: DocumentPage,
  project?: DocumentProject,
  pageIndex = 0,
): CollageGridElement[] => {
  if (page.grids?.length) return page.grids;
  if (!page.cells.length) return [];

  const template =
    COLLAGE_LAYOUTS.find((candidate) => candidate.id === page.layoutTemplateId) ||
    COLLAGE_LAYOUTS[5];
  const geometry = project ? getDocumentGeometry(project) : undefined;
  const headerHeight =
    project?.kopSurat.enabled && page.showKopSurat !== false && pageIndex === 0 ? 80 : 0;
  const maximumSafeHeight = geometry
    ? Math.max(
        160,
        geometry.baseCanvasHeight -
          geometry.padTopPx -
          geometry.padBottomPx -
          headerHeight -
          12,
      )
    : Number.POSITIVE_INFINITY;
  const initialHeight = Math.min(maximumSafeHeight, page.gridHeightPx || 340);

  return [
    {
      id: `grid-fallback-${page.id}`,
      x: 50,
      y: 50,
      widthPercent: page.gridWidthPercent || 82,
      heightPx: initialHeight,
      cols: page.customGridColumns || template.cols || 2,
      rows: page.customGridRows || template.rows || 2,
      gapMm: page.gridGapMm ?? 3,
      borderRadius: page.cellBorderRadius ?? 2,
      borderWidth: page.cellBorderWidth ?? 1,
      borderColor: page.cellBorderColor || '#94a3b8',
      rotation: 0,
      isLocked: false,
      cells: page.cells,
    },
  ];
};

export const getPhotoImageStyle = (cell: CollageCell): React.CSSProperties =>
  cell.cropRect
    ? {
        position: 'absolute',
        width: `${(1 / (cell.cropRect.width || 1)) * 100}%`,
        height: `${(1 / (cell.cropRect.height || 1)) * 100}%`,
        left: `${(-cell.cropRect.x / (cell.cropRect.width || 1)) * 100}%`,
        top: `${(-cell.cropRect.y / (cell.cropRect.height || 1)) * 100}%`,
        objectFit: 'cover',
        transformOrigin: 'center center',
        transform: `rotate(${cell.rotation || 0}deg)`,
      }
    : {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transformOrigin: 'center center',
        transform: `rotate(${cell.rotation || 0}deg)`,
      };

export const getFloatingTextStyle = (
  text: FloatingTextElement,
  colorMode: 'color' | 'mono' = 'color',
): React.CSSProperties => ({
  userSelect: 'none',
  WebkitUserSelect: 'none',
  fontFamily: text.fontFamily || 'Arial',
  fontSize: `${text.fontSize}px`,
  fontWeight: text.fontWeight === '900' ? 900 : text.fontWeight === 'bold' ? 700 : 400,
  fontStyle: text.fontStyle || 'normal',
  textDecoration: text.textDecoration || 'none',
  textTransform: text.textTransform || 'none',
  textAlign: text.textAlign || 'center',
  color: colorMode === 'mono' ? '#000000' : text.color || '#000000',
  letterSpacing: text.letterSpacing ? `${text.letterSpacing}px` : undefined,
  lineHeight: text.lineHeight || 1.2,
  opacity: text.opacity ?? 1,
  outline: 'none',
  textShadow:
    text.effect === 'shadow' ? '2px 4px 8px rgba(0, 0, 0, 0.4)' : undefined,
  WebkitTextStroke:
    text.effect === 'outline'
      ? `${text.strokeWidth || 1}px ${text.effectColor || '#6366f1'}`
      : undefined,
  backgroundColor:
    text.effect === 'background' ? text.effectColor || '#fef08a' : undefined,
});
