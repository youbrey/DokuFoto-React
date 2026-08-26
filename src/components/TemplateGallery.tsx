import React, { useState } from 'react';
import {
  LayoutGrid,
  Check,
  Info,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Minus,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { CollageLayoutTemplate, CollageCell } from '../types';
import { COLLAGE_LAYOUTS } from '../utils/constants';

interface TemplateGalleryProps {
  currentTemplateId: string;
  isGridVisible?: boolean;
  onSelectTemplate: (templateId: string) => void;
  onToggleGridVisibility?: (visible: boolean) => void;
  onClearAllPhotos?: () => void;
  onApplyCustomGrid?: (cols: number, rows: number, slotCount: number) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  currentTemplateId,
  isGridVisible = true,
  onSelectTemplate,
  onToggleGridVisibility,
  onClearAllPhotos,
  onApplyCustomGrid,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customCols, setCustomCols] = useState<number>(3);
  const [customRows, setCustomRows] = useState<number>(2);
  const [customSlots, setCustomSlots] = useState<number>(6);

  const categories = [
    { id: 'all', label: 'Semua Kisi' },
    { id: 'custom', label: '✨ Tata Letak Kustom' },
    { id: '1-foto', label: '1 Foto' },
    { id: '2-foto', label: '2 Foto' },
    { id: '3-foto', label: '3 Foto' },
    { id: '4-foto', label: '4 Foto' },
    { id: '5-foto', label: '5 Foto' },
    { id: '6-foto', label: '6 Foto' },
    { id: '8-foto', label: '8 Foto' },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? COLLAGE_LAYOUTS
      : COLLAGE_LAYOUTS.filter((t) => t.category === selectedCategory);

  const handleApplyCustom = () => {
    if (onApplyCustomGrid) {
      onApplyCustomGrid(customCols, customRows, customSlots);
    }
  };

  return (
    <div className="p-4 space-y-4 text-slate-200">
      {/* Header with Title & Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-sky-400" />
            <span>Tata Letak Kisi Foto</span>
          </h3>
          <p className="text-xs text-slate-400">
            Pilih template baku atau bangun kisi kustom sesuai kebutuhan
          </p>
        </div>
      </div>

      {/* Grid Status & Master Delete / Toggle Action */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isGridVisible ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-200">
              Status Kisi Foto: {isGridVisible ? 'Aktif di Lembar' : 'Dihapus / Sembunyi'}
            </span>
          </div>

          {onToggleGridVisibility && (
            <button
              type="button"
              onClick={() => onToggleGridVisibility(!isGridVisible)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                isGridVisible
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
              }`}
              title={
                isGridVisible
                  ? 'Hapus / Sembunyikan kisi kolase dari halaman ini'
                  : 'Tampilkan kembali kisi kolase pada halaman ini'
              }
            >
              {isGridVisible ? (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kisi</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pasang Kisi</span>
                </>
              )}
            </button>
          )}
        </div>

        {onClearAllPhotos && isGridVisible && (
          <button
            type="button"
            onClick={onClearAllPhotos}
            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Kosongkan Semua Foto di Halaman Ini</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
              selectedCategory === cat.id
                ? 'bg-sky-600 text-white shadow-sm font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Custom Grid Layout Builder */}
      {selectedCategory === 'custom' ? (
        <div className="p-4 bg-slate-900 border border-sky-500/60 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-sky-400">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Buat Tata Letak Kisi Kustom
            </h4>
          </div>

          <div className="space-y-3">
            {/* Columns Slider/Buttons */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Jumlah Kolom:</span>
                <span className="font-bold text-sky-400">{customCols} Kolom</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setCustomCols(col)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      customCols === col
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Photo Slots */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Jumlah Slot Foto:</span>
                <span className="font-bold text-sky-400">{customSlots} Slot</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 8, 9, 10, 12].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setCustomSlots(slot)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                      customSlots === slot
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Visual Preview */}
            <div className="pt-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                Pratinjau Tata Letak Kustom ({customCols} Kolom × {customSlots} Slot)
              </div>
              <div
                className="w-full aspect-[4/3] bg-slate-950 rounded-xl p-2 border border-slate-800 grid gap-1.5 shadow-inner"
                style={{
                  gridTemplateColumns: `repeat(${customCols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: customSlots }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-gradient-to-b from-sky-900/60 to-indigo-950/80 border border-sky-500/40 flex items-center justify-center text-[10px] font-bold text-sky-300"
                  >
                    #{idx + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApplyCustom}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-950/40 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Tata Letak Kustom Ini</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard Templates List */
        <div className="grid grid-cols-2 gap-2.5 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {filteredTemplates.map((template) => {
            const isSelected = template.id === currentTemplateId && isGridVisible;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelectTemplate(template.id)}
                className={`group relative p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-500 shadow-lg ring-2 ring-sky-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-sky-500/50 hover:bg-slate-850'
                }`}
              >
                {/* Active Badge */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                {/* Graphic Visual Representation of the Grid */}
                <div
                  className="w-full aspect-[4/3] bg-slate-950 rounded-xl p-1.5 border border-slate-800 grid gap-1 mb-2 shadow-inner"
                  style={{
                    gridTemplateRows: `repeat(${template.rows}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${template.cols}, minmax(0, 1fr))`,
                  }}
                >
                  {template.cells.map((cell, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden bg-gradient-to-b from-sky-900/60 via-slate-800 to-indigo-950/80 border border-sky-500/30 flex items-center justify-center shadow-xs"
                      style={{
                        gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined,
                        gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined,
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400/40 border border-sky-300/40" />
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                    {template.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {template.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <p>
          Anda dapat mengubah ukuran tinggi dan lebar kisi foto secara bebas dengan menarik bingkai (drag frame) langsung pada lembar dokumen.
        </p>
      </div>
    </div>
  );
};
