import React, { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Sliders,
  Maximize2,
  X,
  Check,
  Palette,
  Layers,
  ArrowUpDown,
  MoveHorizontal,
  Copy,
  Lock,
  Unlock,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Move,
} from 'lucide-react';
import { DocumentPage, CollageCell, CollageGridElement } from '../types';
import { COLOR_PALETTES } from '../utils/constants';

interface GridFrameToolbarProps {
  selectedGrid?: CollageGridElement | null;
  activePage: DocumentPage;
  onUpdateGrid?: (updated: Partial<CollageGridElement>) => void;
  onDuplicateGrid?: () => void;
  onDeleteGrid?: () => void;
  onAutoFitToPage?: () => void;
  onUpdateActivePage: (updated: Partial<DocumentPage>) => void;
  onAddCell: () => void;
  onRemoveLastCell: () => void;
  onClearAllPhotos: () => void;
  onOpenTemplateGallery?: () => void;
  onClose: () => void;
}

export const GridFrameToolbar: React.FC<GridFrameToolbarProps> = ({
  selectedGrid,
  activePage,
  onUpdateGrid,
  onDuplicateGrid,
  onDeleteGrid,
  onAutoFitToPage,
  onUpdateActivePage,
  onAddCell,
  onRemoveLastCell,
  onClearAllPhotos,
  onOpenTemplateGallery,
  onClose,
}) => {
  const [showBorderPopover, setShowBorderPopover] = useState(false);
  const [showSizePopover, setShowSizePopover] = useState(false);
  const [showGapPopover, setShowGapPopover] = useState(false);

  const currentColumns = selectedGrid?.cols || activePage.customGridColumns || 2;
  const currentGap =
    selectedGrid?.gapMm !== undefined
      ? selectedGrid.gapMm
      : activePage.gridGapMm !== undefined
      ? activePage.gridGapMm
      : 3;
  const currentRadius =
    selectedGrid?.borderRadius !== undefined
      ? selectedGrid.borderRadius
      : activePage.cellBorderRadius !== undefined
      ? activePage.cellBorderRadius
      : 2;
  const currentBorderWidth =
    selectedGrid?.borderWidth !== undefined
      ? selectedGrid.borderWidth
      : activePage.cellBorderWidth !== undefined
      ? activePage.cellBorderWidth
      : 1;
  const currentBorderColor =
    selectedGrid?.borderColor || activePage.cellBorderColor || '#cbd5e1';
  const currentHeightPx = selectedGrid?.heightPx || activePage.gridHeightPx || 320;
  const currentWidthPercent = selectedGrid?.widthPercent || activePage.gridWidthPercent || 80;
  const slotCount = selectedGrid?.cells?.length || activePage.cells.length;

  const handleHeightDelta = (delta: number) => {
    const baseHeight = currentHeightPx || 320;
    const newHeight = Math.max(100, Math.min(850, baseHeight + delta));
    if (onUpdateGrid && selectedGrid) {
      onUpdateGrid({ heightPx: newHeight });
    }
    onUpdateActivePage({ gridHeightPx: newHeight });
  };

  const handleWidthDelta = (delta: number) => {
    const newWidth = Math.max(20, Math.min(100, currentWidthPercent + delta));
    if (onUpdateGrid && selectedGrid) {
      onUpdateGrid({ widthPercent: newWidth });
    }
    onUpdateActivePage({ gridWidthPercent: newWidth });
  };

  const handleColumnsDelta = (delta: number) => {
    const newCols = Math.max(1, Math.min(6, currentColumns + delta));
    if (onUpdateGrid && selectedGrid) {
      onUpdateGrid({ cols: newCols });
    }
    onUpdateActivePage({ customGridColumns: newCols });
  };

  const handleCenterGrid = () => {
    if (onUpdateGrid && selectedGrid) {
      onUpdateGrid({ x: 50, y: 50 });
    }
  };

  return (
    <div
      id="grid-frame-toolbar"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-900/98 backdrop-blur-md text-white border border-sky-500/80 rounded-2xl shadow-2xl px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none max-w-[95vw]"
    >
      {/* Indicator */}
      <div className="flex items-center gap-1.5 pl-1 pr-2 text-xs font-bold text-sky-400 border-r border-slate-700/80">
        <LayoutGrid className="w-4 h-4 text-sky-400 animate-pulse" />
        <span>Kisi Foto ({slotCount} Slot)</span>
      </div>

      {/* 1. Height Controls (Tinggi Kisi) */}
      <div
        className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 shadow-inner"
        title="Atur Tinggi Kisi Foto (Drag handle atau tombol +/-)"
      >
        <button
          type="button"
          onClick={() => handleHeightDelta(-20)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
          title="Kurangi Tinggi Kisi"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="px-2 text-center">
          <span className="text-[11px] font-mono font-bold text-sky-300">
            {currentHeightPx}px
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleHeightDelta(+20)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
          title="Tambah Tinggi Kisi"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Width Controls (Lebar Kisi %) */}
      <div
        className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 shadow-inner"
        title="Atur Lebar Kisi Foto (%)"
      >
        <button
          type="button"
          onClick={() => handleWidthDelta(-5)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
          title="Kecilkan Lebar Kisi"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="px-1.5 text-center min-w-[38px]">
          <span className="text-[11px] font-mono font-bold text-slate-200">
            {currentWidthPercent}%
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleWidthDelta(+5)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-90"
          title="Lebarkan Kisi"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center to page */}
      <button
        type="button"
        onClick={handleCenterGrid}
        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
        title="Pusatkan kisi di tengah halaman dokumen"
      >
        <AlignHorizontalJustifyCenter className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline text-[11px]">Pusatkan</span>
      </button>

      {/* Auto-Fit to Paper Margins */}
      {onAutoFitToPage && (
        <button
          type="button"
          onClick={onAutoFitToPage}
          className="p-1.5 px-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-white border border-sky-600/70 text-xs font-semibold flex items-center gap-1 transition shadow-sm"
          title="Pas-kan ukuran & posisi kisi secara proporsional ke batas aman kertas cetak"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-bold">Pas-kan ke Kertas</span>
        </button>
      )}

      <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

      {/* 3. Slot Management (+ Slot / - Slot) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onAddCell}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
          title="Tambahkan 1 Slot Foto Baru ke Kisi"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Slot</span>
        </button>

        {slotCount > 1 && (
          <button
            type="button"
            onClick={onRemoveLastCell}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition"
            title="Kurangi 1 Slot Foto Terakhir"
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">- Slot</span>
          </button>
        )}
      </div>

      {/* 4. Column Controls */}
      <div
        className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5"
        title="Ubah Jumlah Kolom Kisi"
      >
        <button
          type="button"
          onClick={() => handleColumnsDelta(-1)}
          disabled={currentColumns <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="px-1.5 text-[11px] font-bold text-amber-300">
          {currentColumns} Kolom
        </span>
        <button
          type="button"
          onClick={() => handleColumnsDelta(+1)}
          disabled={currentColumns >= 6}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

      {/* 5. Jarak Antar Foto (Grid Gap) Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowGapPopover(!showGapPopover);
            setShowBorderPopover(false);
            setShowSizePopover(false);
          }}
          className={`p-1.5 px-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
            showGapPopover
              ? 'bg-sky-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
          }`}
          title="Atur Jarak Spasi Antar Foto (Grid Gap)"
        >
          <MoveHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px]">Spasi {currentGap}mm</span>
        </button>

        {showGapPopover && (
          <div className="absolute top-full mt-2 left-0 w-48 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-2">
            <div className="text-[11px] font-bold text-slate-300">Jarak Antar Foto</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={16}
                step={1}
                value={currentGap}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (onUpdateGrid && selectedGrid) onUpdateGrid({ gapMm: val });
                  onUpdateActivePage({ gridGapMm: val });
                }}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-sky-400 w-8">
                {currentGap}mm
              </span>
            </div>
            <div className="flex justify-between gap-1 pt-1">
              {[0, 2, 4, 8, 12].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    if (onUpdateGrid && selectedGrid) onUpdateGrid({ gapMm: g });
                    onUpdateActivePage({ gridGapMm: g });
                  }}
                  className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition ${
                    currentGap === g
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {g}mm
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Border & Radius Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowBorderPopover(!showBorderPopover);
            setShowGapPopover(false);
            setShowSizePopover(false);
          }}
          className={`p-1.5 px-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
            showBorderPopover
              ? 'bg-sky-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
          }`}
          title="Atur Garis Batas & Sudut Lengkung Foto"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px]">Bingkai</span>
        </button>

        {showBorderPopover && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-300 mb-1">
                Ketebalan Garis ({currentBorderWidth}px)
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((bw) => (
                  <button
                    key={bw}
                    type="button"
                    onClick={() => {
                      if (onUpdateGrid && selectedGrid) onUpdateGrid({ borderWidth: bw });
                      onUpdateActivePage({ cellBorderWidth: bw });
                    }}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                      currentBorderWidth === bw
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {bw === 0 ? 'Polos' : `${bw}px`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-300 mb-1">
                Sudut Lengkung / Radius ({currentRadius}px)
              </div>
              <div className="flex gap-1">
                {[0, 2, 4, 8, 16].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      if (onUpdateGrid && selectedGrid) onUpdateGrid({ borderRadius: r });
                      onUpdateActivePage({ cellBorderRadius: r });
                    }}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition ${
                      currentRadius === r
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {r}px
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-300 mb-1">Warna Garis</div>
              <div className="grid grid-cols-7 gap-1">
                {COLOR_PALETTES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      if (onUpdateGrid && selectedGrid) onUpdateGrid({ borderColor: color });
                      onUpdateActivePage({ cellBorderColor: color });
                    }}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition ${
                      currentBorderColor === color
                        ? 'border-sky-400 ring-2 ring-sky-400/40 scale-110'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {currentBorderColor === color && (
                      <Check
                        className={`w-3 h-3 ${
                          color === '#ffffff' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Duplicate Grid */}
      {onDuplicateGrid && (
        <button
          type="button"
          onClick={onDuplicateGrid}
          className="p-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
          title="Duplikat kisi ini"
        >
          <Copy className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline text-[11px]">Duplikat</span>
        </button>
      )}

      {/* 8. Delete / Clear Actions */}
      {onDeleteGrid && (
        <button
          type="button"
          onClick={onDeleteGrid}
          className="p-1.5 px-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1 transition"
          title="Hapus kisi ini dari dokumen"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Hapus Kisi</span>
        </button>
      )}

      {/* Close Toolbar */}
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white ml-auto transition"
        title="Tutup Bilah Pengaturan Kisi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
