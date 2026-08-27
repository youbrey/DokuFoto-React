import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DocumentProject, CollageGridElement, DocumentPage } from '../types';
import { PAPER_DIMENSIONS } from '../utils/constants';
import { createPrintMarkup, createRasterPagesHtml } from '../utils/printMarkup';
import { getDocumentGeometry, getPageGrids } from '../utils/pageVisual';
import { renderProjectPagesToPng } from '../utils/pageRender';
import { DocumentPageView } from './DocumentPageView';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DocumentProject;
  onUpdateProject?: (project: DocumentProject) => void;
}

const waitForPrintAssets = async (printWindow: Window): Promise<void> => {
  const printDocument = printWindow.document;
  const imagePromises = Array.from(printDocument.images).map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;

    await new Promise<void>((resolve) => {
      const finish = () => resolve();
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
      window.setTimeout(finish, 10_000);
    });
  });

  await Promise.all(imagePromises);
  if (printDocument.fonts?.ready) await printDocument.fonts.ready;

  await new Promise<void>((resolve) => {
    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(() => resolve());
    });
  });
};

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}) => {
  const [colorMode, setColorMode] = useState<'color' | 'mono'>('color');
  const [activePreviewPage, setActivePreviewPage] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(90);

  const paperInfo = PAPER_DIMENSIONS[project.paperSize] || PAPER_DIMENSIONS.F4;
  const isLandscape = project.orientation === 'landscape';
  const {
    widthMm,
    heightMm,
    baseCanvasWidth,
    baseCanvasHeight,
    padLeftPx,
    padRightPx,
    padTopPx,
    padBottomPx,
  } = getDocumentGeometry(project);

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
    const grids = getPageGrids(page, project, activePreviewPage);
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
    const grids = getPageGrids(page, project, activePreviewPage);
    if (!grids || grids.length === 0) return;

    const headerH = project.kopSurat.enabled && page.showKopSurat !== false && activePreviewPage === 0 ? 80 : 0;
    const topUsed = padTopPx + headerH;
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

  const handlePrint = () => {
    // Dibuka langsung dari klik pengguna agar tidak dianggap pop-up otomatis.
    const printWindow = window.open('', '_blank', 'popup=yes,width=1100,height=850');
    if (!printWindow) {
      setPrintError('Jendela cetak diblokir browser. Izinkan pop-up untuk alamat localhost ini, lalu coba lagi.');
      return;
    }

    setIsPrinting(true);
    setPrintError(null);

    printWindow.document.open();
    printWindow.document.write(
      '<!doctype html><html lang="id"><meta charset="utf-8"><title>Menyiapkan cetak</title><body style="font:16px Arial;padding:32px">Merender halaman 300 DPI…</body></html>',
    );
    printWindow.document.close();

    void renderProjectPagesToPng(project, { colorMode, dpi: 300 })
      .then((renderedPages) => {
        printWindow.document.open();
        printWindow.document.write(
          createPrintMarkup({
            title: project.title,
            fontFamily: project.fontFamily,
            widthMm,
            heightMm,
            localStyles: '',
            innerHtml: createRasterPagesHtml(renderedPages.map((page) => page.dataUrl)),
          }),
        );
        printWindow.document.close();
        return waitForPrintAssets(printWindow);
      })
        .then(() => {
          printWindow.focus();
          printWindow.print();
        })
        .catch((error) => {
          console.error('Print asset preparation error:', error);
          setPrintError(
            error instanceof Error
              ? `Dokumen cetak gagal dirender: ${error.message}`
              : 'Dokumen cetak tidak selesai dimuat. Tutup jendela cetak dan coba lagi.',
          );
        })
        .finally(() => setIsPrinting(false));
  };

  const currentPage: DocumentPage = project.pages[activePreviewPage] || project.pages[0];

  if (!isOpen) return null;

  return (
      /* Screen Interactive Modal */
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
                className={`bg-white text-slate-900 shadow-2xl relative overflow-hidden transition-transform select-none ${
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
                <DocumentPageView project={project} page={currentPage} />
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
                    Printer yang terpasang dideteksi oleh dialog cetak Windows. Pilih printer dan jumlah salinan setelah menekan tombol cetak.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80">
                  <p className="text-[11px] leading-relaxed text-emerald-200/90">
                    Cetak dan DOCX memakai gambar halaman 300 DPI dari renderer yang sama dengan
                    pratinjau ini. Posisi, crop, ukuran kisi, dan teks tidak dibangun ulang.
                  </p>
                </div>

                {printError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-700 text-[11px] leading-relaxed text-red-200">
                    {printError}
                  </div>
                )}

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
                  <span>{isPrinting ? 'Merender Halaman 300 DPI...' : 'Buka Dialog Printer Windows'}</span>
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
  );
};
