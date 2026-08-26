import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  AlertCircle,
  Copy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import {
  DocumentProject,
  FloatingTextElement,
  CollageGridElement,
  DocumentPage,
} from '../types';
import { PAPER_DIMENSIONS } from '../utils/constants';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DocumentProject;
  onUpdateProject?: (project: DocumentProject) => void;
}

// Module-level helper to extract grids for a given page
const getPageGrids = (page?: DocumentPage): CollageGridElement[] => {
  if (!page) return [];
  if (page.grids && page.grids.length > 0) {
    return page.grids;
  }
  if (page.cells && page.cells.length > 0) {
    return [
      {
        id: 'grid-default-preview',
        x: 50,
        y: 50,
        widthPercent: page.gridWidthPercent || 80,
        heightPx: page.gridHeightPx || 340,
        cols: page.customGridColumns || 2,
        rows: page.customGridRows || 2,
        gapMm: page.gridGapMm !== undefined ? page.gridGapMm : 3,
        borderRadius: page.cellBorderRadius !== undefined ? page.cellBorderRadius : 2,
        borderWidth: page.cellBorderWidth !== undefined ? page.cellBorderWidth : 1,
        borderColor: page.cellBorderColor || '#cbd5e1',
        rotation: 0,
        isLocked: false,
        cells: page.cells,
      },
    ];
  }
  return [];
};

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

const collectLocalStyles = (): string =>
  Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}) => {
  const [colorMode, setColorMode] = useState<'color' | 'mono'>('color');
  const [activePreviewPage, setActivePreviewPage] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(90);

  const paperInfo = PAPER_DIMENSIONS[project.paperSize] || PAPER_DIMENSIONS.F4;
  const isLandscape = project.orientation === 'landscape';
  const widthMm = isLandscape ? paperInfo.heightMm : paperInfo.widthMm;
  const heightMm = isLandscape ? paperInfo.widthMm : paperInfo.heightMm;
  const aspectRatio = widthMm / heightMm;

  // Base canvas coordinate dimensions matching CollageCanvas 1:1
  const baseCanvasWidth = isLandscape ? Math.round(560 * aspectRatio) : 560;
  const baseCanvasHeight = isLandscape ? 560 : Math.round(560 / aspectRatio);

  // Exact scale factor from 560px canonical canvas to physical print page (96 DPI: 1mm = 3.779527559px)
  const printScale = (widthMm * 3.779527559) / baseCanvasWidth;

  // Exact proportional padding matching real paper margins
  const padLeftPx = (project.margins.left * 10 / widthMm) * baseCanvasWidth;
  const padRightPx = (project.margins.right * 10 / widthMm) * baseCanvasWidth;
  const padTopPx = (project.margins.top * 10 / heightMm) * baseCanvasHeight;
  const padBottomPx = (project.margins.bottom * 10 / heightMm) * baseCanvasHeight;

  // Auto calculate comfortable zoom on open
  useEffect(() => {
    if (isOpen) {
      const windowH = window.innerHeight || 800;
      const availableH = windowH - 240;
      const fitZoom = Math.min(100, Math.max(50, Math.floor((availableH / baseCanvasHeight) * 100)));
      setPreviewZoom(fitZoom);
    }
  }, [isOpen, baseCanvasHeight]);

  // Check if current page content exceeds bottom margin boundary
  const isCurrentPageOverflowing = React.useMemo(() => {
    const page = project.pages[activePreviewPage] || project.pages[0];
    if (!page) return false;
    const grids = getPageGrids(page);
    const safeBottom = baseCanvasHeight - padBottomPx;
    return grids.some((g) => {
      const gridBottom = (g.y / 100) * baseCanvasHeight + g.heightPx / 2;
      return gridBottom > safeBottom + 6;
    });
  }, [project.pages, activePreviewPage, baseCanvasHeight, padBottomPx]);

  const handleAutoFitCurrentPage = () => {
    if (!onUpdateProject) return;
    const page = project.pages[activePreviewPage];
    if (!page) return;
    const grids = getPageGrids(page);
    if (!grids || grids.length === 0) return;

    const headerH = project.kopSurat.enabled && page.showKopSurat !== false && activePreviewPage === 0 ? 80 : 0;
    const titleH = page.showTitle && page.title ? 35 : 0;
    const topUsed = padTopPx + headerH + titleH;
    const maxAvailableH = Math.max(140, baseCanvasHeight - topUsed - padBottomPx - 10);
    const optimalY = topUsed + maxAvailableH / 2;
    const optimalYPercent = Math.round((optimalY / baseCanvasHeight) * 100);
    const optimalWidthPercent = Math.min(94, Math.max(60, Math.round(100 - ((padLeftPx + padRightPx + 16) / baseCanvasWidth) * 100)));

    let updatedGrids: CollageGridElement[] = [];
    if (grids.length === 1) {
      updatedGrids = [{
        ...grids[0],
        heightPx: Math.round(maxAvailableH),
        y: optimalYPercent,
        x: 50,
        widthPercent: optimalWidthPercent,
      }];
    } else {
      const totalCurrentH = grids.reduce((sum, g) => sum + g.heightPx, 0);
      const spacing = 12 * (grids.length - 1);
      const scaleFactor = Math.min(1, (maxAvailableH - spacing) / totalCurrentH);
      let currentTop = topUsed + 4;
      updatedGrids = grids.map((g) => {
        const newH = Math.max(70, Math.round(g.heightPx * scaleFactor));
        const gridCenterY = currentTop + newH / 2;
        currentTop += newH + 12;
        return {
          ...g,
          heightPx: newH,
          y: Math.round((gridCenterY / baseCanvasHeight) * 100),
          widthPercent: Math.min(g.widthPercent, optimalWidthPercent),
        };
      });
    }

    const updatedPages = [...project.pages];
    updatedPages[activePreviewPage] = {
      ...page,
      grids: updatedGrids,
      gridHeightPx: updatedGrids[0]?.heightPx,
      gridWidthPercent: updatedGrids[0]?.widthPercent,
    };
    onUpdateProject({ ...project, pages: updatedPages });
  };

  const createPrintMarkup = (innerHtml: string): string => {
    const safeTitle = escapeHtml(project.title || 'Dokumen Kolase Foto');
    const safeFont = (project.fontFamily || 'Arial').replace(/[^a-zA-Z0-9 ,_-]/g, '');
    return `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${safeTitle}</title>
          <style>
            ${collectLocalStyles()}
            @page {
              size: ${widthMm}mm ${heightMm}mm ${isLandscape ? 'landscape' : 'portrait'};
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
              page-break-after: always !important;
              break-after: page !important;
              position: relative !important;
              overflow: hidden !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          </style>
        </head>
        <body><div id="print-wrapper">${innerHtml}</div></body>
      </html>
    `;
  };

  const handlePrint = () => {
    setIsPrinting(true);

    try {
      // 1. Create a dedicated print iframe
      const printIframe = document.createElement('iframe');
      printIframe.name = 'print_frame';
      printIframe.style.position = 'fixed';
      printIframe.style.top = '-10000px';
      printIframe.style.left = '-10000px';
      printIframe.style.width = `${widthMm}mm`;
      printIframe.style.height = `${heightMm}mm`;
      printIframe.style.border = 'none';
      printIframe.style.opacity = '0';
      document.body.appendChild(printIframe);

      // Collect HTML of all pages
      const printContainer = document.getElementById('print-all-pages-container');
      const innerHtml = printContainer ? printContainer.innerHTML : '';

      const printDocument = printIframe.contentWindow?.document;
      if (printDocument) {
        printDocument.open();
        printDocument.write(createPrintMarkup(innerHtml));
        printDocument.close();

        // Wait for images inside the iframe to load before triggering print
        const imgs = printDocument.querySelectorAll('img');
        const imgPromises: Promise<void>[] = [];
        imgs.forEach((img) => {
          if (!img.complete) {
            imgPromises.push(
              new Promise((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
            );
          }
        });

        const executePrintDialog = () => {
          setTimeout(() => {
            try {
              printIframe.contentWindow?.focus();
              printIframe.contentWindow?.print();
            } catch (err) {
              console.warn('Iframe print blocked, invoking window.print fallback:', err);
              window.focus();
              window.print();
            } finally {
              setIsPrinting(false);
              setTimeout(() => {
                if (document.body.contains(printIframe)) {
                  document.body.removeChild(printIframe);
                }
              }, 4000);
            }
          }, 300);
        };

        if (imgPromises.length > 0) {
          Promise.all(imgPromises).then(executePrintDialog).catch(executePrintDialog);
        } else {
          executePrintDialog();
        }
      } else {
        // Fallback to window.print
        window.focus();
        window.print();
        setIsPrinting(false);
      }
    } catch (e) {
      console.error('Print trigger error:', e);
      window.focus();
      window.print();
      setIsPrinting(false);
    }
  };

  const handleOpenPrintWindow = () => {
    try {
      const printContainer = document.getElementById('print-all-pages-container');
      const innerHtml = printContainer ? printContainer.innerHTML : '';
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(createPrintMarkup(innerHtml));
        newWin.document.close();
        window.setTimeout(() => {
          newWin.focus();
          newWin.print();
        }, 500);
      } else {
        handlePrint();
      }
    } catch (err) {
      handlePrint();
    }
  };

  const currentPage: DocumentPage = project.pages[activePreviewPage] || project.pages[0];

  const getTextEffectStyle = (textEl: FloatingTextElement): React.CSSProperties => {
    const style: React.CSSProperties = {
      fontFamily: textEl.fontFamily || 'Arial',
      fontSize: `${textEl.fontSize}px`,
      fontWeight: textEl.fontWeight === '900' ? 900 : textEl.fontWeight === 'bold' ? 700 : 400,
      fontStyle: textEl.fontStyle || 'normal',
      textDecoration: textEl.textDecoration || 'none',
      textTransform: textEl.textTransform || 'none',
      textAlign: textEl.textAlign || 'center',
      color: colorMode === 'mono' ? '#000000' : textEl.color || '#000000',
      letterSpacing: textEl.letterSpacing ? `${textEl.letterSpacing}px` : undefined,
      lineHeight: textEl.lineHeight || 1.2,
      opacity: textEl.opacity !== undefined ? textEl.opacity : 1,
    };

    if (textEl.effect === 'shadow') {
      style.textShadow = '2px 4px 8px rgba(0, 0, 0, 0.4)';
    } else if (textEl.effect === 'outline') {
      const strokeCol = textEl.effectColor || '#6366f1';
      style.WebkitTextStroke = `${textEl.strokeWidth || 1}px ${strokeCol}`;
    } else if (textEl.effect === 'background') {
      style.backgroundColor = textEl.effectColor || '#fef08a';
      style.padding = '2px 6px';
      style.borderRadius = '4px';
    }

    return style;
  };

  // Authoritative, pixel-perfect page content renderer (exact 1:1 match with canvas)
  const renderPageContent = (page: DocumentPage, pageIndex: number, isPrintMode = false) => {
    const grids = getPageGrids(page);
    const floatingTexts = page.floatingTexts || [];

    return (
      <div
        className="w-full h-full relative"
        style={{
          width: `${baseCanvasWidth}px`,
          height: `${baseCanvasHeight}px`,
          boxSizing: 'border-box',
          paddingTop: `${padTopPx}px`,
          paddingBottom: `${padBottomPx}px`,
          paddingLeft: `${padLeftPx}px`,
          paddingRight: `${padRightPx}px`,
          fontFamily: project.fontFamily || 'Arial',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Static Document Title (Optional) */}
        {page.showTitle && page.title && (
          <div className="text-center mb-2.5 pointer-events-none">
            <h2 className="text-xs font-black uppercase tracking-tight text-slate-900">
              {page.title}
            </h2>
            {page.subtitle && (
              <p className="text-[9.5px] italic font-semibold text-slate-700 mt-0.5">
                {page.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Optional Meta Table */}
        {page.showMetaTable && page.metaTable && page.metaTable.length > 0 && (
          <div className="text-[8.5px] mb-2 bg-slate-50 p-1.5 rounded border border-slate-200 pointer-events-none">
            {page.metaTable.slice(0, 3).map((m, i) => (
              <div key={i} className="flex gap-1">
                <span className="w-20 font-bold text-slate-800">{m.label}</span>
                <span>:</span>
                <span className="flex-1 text-slate-700">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Optional Activity Description */}
        {page.showDescription && page.activityDescription && (
          <p className="text-[8.5px] text-slate-700 mb-2 leading-relaxed pointer-events-none">
            {page.activityDescription}
          </p>
        )}

        {/* Freeform Draggable/Positioned Grids (Matching Canvas Pixel-Perfect) */}
        {page.showCollageGrid !== false &&
          grids.map((grid) => {
            const cols = grid.cols || 2;
            const rows = grid.rows || Math.max(1, Math.ceil(grid.cells.length / cols));
            const gridGap = grid.gapMm !== undefined ? grid.gapMm : 3;

            return (
              <div
                key={grid.id}
                className="absolute select-none overflow-hidden"
                style={{
                  left: `${grid.x}%`,
                  top: `${grid.y}%`,
                  width: `${grid.widthPercent}%`,
                  height: `${grid.heightPx}px`,
                  transform: `translate(-50%, -50%) rotate(${grid.rotation || 0}deg)`,
                }}
              >
                <div
                  className="w-full h-full grid"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    gap: `${gridGap}px`,
                  }}
                >
                  {grid.cells.map((cell, cIdx) => (
                    <div
                      key={cell.id || cIdx}
                      className="relative overflow-hidden flex flex-col justify-between"
                      style={{
                        gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined,
                        gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined,
                        borderRadius: `${grid.borderRadius !== undefined ? grid.borderRadius : 2}px`,
                        borderWidth: `${grid.borderWidth !== undefined ? grid.borderWidth : 1}px`,
                        borderColor: grid.borderColor || '#cbd5e1',
                        borderStyle: grid.borderWidth && grid.borderWidth > 0 ? 'solid' : 'none',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      {cell.photo ? (
                        <div className="w-full h-full relative overflow-hidden flex-1 bg-slate-100 flex items-center justify-center">
                          <img
                            src={cell.photo.dataUrl}
                            alt=""
                            className="w-full h-full object-cover select-none pointer-events-none"
                            style={{
                              transform: `rotate(${cell.rotation || 0}deg)`,
                              clipPath: cell.cropRect
                                ? `inset(${cell.cropRect.y * 100}% ${(1 - cell.cropRect.x - cell.cropRect.width) * 100}% ${(1 - cell.cropRect.y - cell.cropRect.height) * 100}% ${cell.cropRect.x * 100}%)`
                                : undefined,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-100/90 flex flex-col items-center justify-center p-1 text-slate-400">
                          <ImageIcon className="w-4 h-4 text-slate-300 mb-0.5" />
                          <span className="text-[8px] font-bold">[Slot Foto {cIdx + 1}]</span>
                        </div>
                      )}

                      {cell.showCaption && cell.caption && (
                        <div className="bg-white/95 px-1 py-0.5 border-t border-slate-200 text-[8px] text-slate-800 text-center font-medium line-clamp-1">
                          {cell.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        {/* Freeform Floating Text Elements (Matching Canvas Pixel-Perfect) */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute pointer-events-none select-none"
            style={{
              left: `${ft.x}%`,
              top: `${ft.y}%`,
              transform: `translate(-50%, -50%) rotate(${ft.rotation || 0}deg)`,
              width: ft.width ? `${ft.width}px` : 'auto',
            }}
          >
            <div style={getTextEffectStyle(ft)}>{ft.text}</div>
          </div>
        ))}

        {/* Signature Block (if enabled) */}
        {page.showSignature && page.signatureBlock && (
          <div className="absolute bottom-8 right-8 text-right text-[8.5px] pointer-events-none">
            <p>{page.signatureBlock.cityAndDate}</p>
            <p className="font-bold">{page.signatureBlock.roleTitle}</p>
            <div className="h-8" />
            <p className="font-bold underline">{page.signatureBlock.officerName}</p>
            <p>{page.signatureBlock.nip}</p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Injected Print Stylesheet for 1:1 Hardware Print & PDF Fidelity */}
      <style>{`
        @media print {
          @page {
            size: ${widthMm}mm ${heightMm}mm ${isLandscape ? 'landscape' : 'portrait'};
            margin: 0mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #print-all-pages-container, #print-all-pages-container * {
            visibility: visible;
          }
          #print-all-pages-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .print-single-page {
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            page-break-after: always !important;
            break-after: page !important;
            position: relative !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Scaled Print Container for Hardware & PDF Output (Exact Pixel-to-Physical Scaling) */}
      <div id="print-all-pages-container" className="hidden print:block">
        {project.pages.map((page, idx) => (
          <div
            key={page.id || idx}
            className={`print-single-page ${
              colorMode === 'mono' ? 'grayscale contrast-125' : ''
            }`}
            style={{
              width: `${widthMm}mm`,
              height: `${heightMm}mm`,
              position: 'relative',
              overflow: 'hidden',
              background: '#ffffff',
            }}
          >
            {/* Exactly Scaled Canonical Canvas Element */}
            <div
              style={{
                width: `${baseCanvasWidth}px`,
                height: `${baseCanvasHeight}px`,
                transform: `scale(${printScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                overflow: 'hidden',
                background: '#ffffff',
              }}
            >
              {renderPageContent(page, idx, true)}
            </div>
          </div>
        ))}
      </div>

      {/* Screen Interactive Modal */}
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 no-print">
        <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full h-[94vh] flex flex-col overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-150 text-white">
          {/* Header */}
          <div className="px-6 py-3.5 bg-slate-950 text-white flex items-center justify-between flex-shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Printer className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm">Pratinjau & Cetak Dokumen (Setwan DokuFoto)</h3>
                <p className="text-[10px] text-slate-400">
                  Ukuran Fisik Asli: {paperInfo.name} ({widthMm} × {heightMm} mm) • {isLandscape ? 'Landscape' : 'Portrait'} • Margin: T:{project.margins.top} B:{project.margins.bottom} L:{project.margins.left} R:{project.margins.right} cm
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Main Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Pratinjau Lembar Kertas 1:1 Scale */}
            <div className="flex-1 bg-slate-950/70 p-6 overflow-auto flex flex-col items-center justify-center relative">
              {/* Top Controls Toolbar */}
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900/90 backdrop-blur-xs border border-slate-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow pointer-events-auto">
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-medium">
                      Pratinjau WYSIWYG: {paperInfo.name} ({widthMm} × {heightMm} mm) • Halaman {activePreviewPage + 1}/{project.pages.length}
                    </span>
                  </div>

                  {isCurrentPageOverflowing && onUpdateProject && (
                    <button
                      type="button"
                      onClick={handleAutoFitCurrentPage}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow pointer-events-auto transition animate-pulse"
                      title="Rapikan & pas-kan kisi ke batas aman margin kertas cetak"
                    >
                      <span>⚠️ Pas-kan ke Halaman</span>
                    </button>
                  )}
                </div>

                {/* Zoom Controls */}
                <div className="bg-slate-900/90 backdrop-blur-xs border border-slate-700 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow pointer-events-auto">
                  <button
                    onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Perkecil Pratinjau"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-[11px] w-10 text-center">{previewZoom}%</span>
                  <button
                    onClick={() => setPreviewZoom((z) => Math.min(150, z + 10))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Perbesar Pratinjau"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const windowH = window.innerHeight || 800;
                      const availableH = windowH - 240;
                      setPreviewZoom(Math.min(100, Math.max(50, Math.floor((availableH / baseCanvasHeight) * 100))));
                    }}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white ml-1 border-l border-slate-700 pl-1.5 text-[10px] font-bold"
                    title="Pas-kan ke Layar (Fit Screen)"
                  >
                    Fit
                  </button>
                </div>
              </div>

              {/* Visual Paper Replica (Matching Canvas Perfectly) */}
              <div
                className={`bg-white text-slate-900 shadow-2xl rounded-xs relative overflow-hidden transition-transform select-none ${
                  colorMode === 'mono' ? 'grayscale contrast-125' : ''
                }`}
                style={{
                  width: `${baseCanvasWidth}px`,
                  height: `${baseCanvasHeight}px`,
                  boxSizing: 'border-box',
                  transform: `scale(${previewZoom / 100})`,
                  transformOrigin: 'center center',
                }}
              >
                {renderPageContent(currentPage, activePreviewPage, false)}
              </div>

              {/* Pagination Controls */}
              {project.pages.length > 1 && (
                <div className="mt-4 flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-700 text-white text-xs z-10 shadow">
                  <button
                    disabled={activePreviewPage === 0}
                    onClick={() => setActivePreviewPage((prev) => prev - 1)}
                    className="p-1 disabled:opacity-30 hover:text-sky-400 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Halaman {activePreviewPage + 1} dari {project.pages.length}
                  </span>
                  <button
                    disabled={activePreviewPage === project.pages.length - 1}
                    onClick={() => setActivePreviewPage((prev) => prev + 1)}
                    className="p-1 disabled:opacity-30 hover:text-sky-400 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Print Settings */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-800/80">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Pemilihan Printer
                  </h4>
                  <p className="text-[11px] leading-relaxed text-sky-200/90">
                    Pilih printer dan jumlah salinan melalui dialog cetak Windows yang muncul setelah menekan tombol cetak.
                  </p>
                </div>

                {/* Color Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Mode Warna Cetak</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setColorMode('color')}
                      className={`p-2 rounded-lg border text-xs font-bold transition ${
                        colorMode === 'color'
                          ? 'bg-sky-950 border-sky-500 text-sky-300 ring-1 ring-sky-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Warna Penuh
                    </button>
                    <button
                      onClick={() => setColorMode('mono')}
                      className={`p-2 rounded-lg border text-xs font-bold transition ${
                        colorMode === 'mono'
                          ? 'bg-sky-950 border-sky-500 text-sky-300 ring-1 ring-sky-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Hitam Putih
                    </button>
                  </div>
                </div>

                {/* Paper Summary Badge */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ukuran Kertas:</span>
                    <span className="font-bold text-slate-200">
                      {project.paperSize} ({paperInfo.name})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dimensi Fisik:</span>
                    <span className="font-bold text-slate-200">
                      {widthMm} × {heightMm} mm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Halaman:</span>
                    <span className="font-bold text-slate-200">{project.pages.length} Lembar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orientasi:</span>
                    <span className="font-bold text-slate-200 capitalize">{project.orientation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Margin Cetak:</span>
                    <span className="font-bold text-emerald-400 font-mono text-[11px]">
                      {project.margins.top} / {project.margins.bottom} / {project.margins.left} / {project.margins.right} cm
                    </span>
                  </div>
                </div>

                {/* Overflow Warning Box */}
                {isCurrentPageOverflowing && onUpdateProject && (
                  <div className="p-3 bg-amber-950/60 border border-amber-500/80 rounded-xl text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <span>⚠️ Peringatan Posisi Kisi</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-snug">
                      Sebagian kisi foto melebihi margin bawah kertas cetak dan berpotensi terpotong.
                    </p>
                    <button
                      type="button"
                      onClick={handleAutoFitCurrentPage}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition shadow"
                    >
                      Otomatis Pas-kan ke Kertas
                    </button>
                  </div>
                )}
              </div>

              {/* Print Action Trigger Button */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isPrinting ? 'Menyiapkan Dialog Cetak...' : 'Cetak Dokumen Sekarang'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPrintWindow}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-400 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5"
                  title="Gunakan ini jika dialog cetak browser utama tidak otomatis terbuka di iframe"
                >
                  <span>Buka di Tab/Jendela Cetak Terpisah</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition text-center"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
