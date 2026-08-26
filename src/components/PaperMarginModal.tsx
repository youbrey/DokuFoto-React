import React from 'react';
import { X, Sliders, Check, Layout, RotateCcw } from 'lucide-react';
import { DocumentProject, PaperSizeType, OrientationType } from '../types';
import { PAPER_DIMENSIONS } from '../utils/constants';

interface PaperMarginModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DocumentProject;
  onUpdateProject: (updated: Partial<DocumentProject>) => void;
}

export const PaperMarginModal: React.FC<PaperMarginModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}) => {
  if (!isOpen) return null;

  const paperKeys: PaperSizeType[] = ['F4', 'A4', 'Letter', 'Legal'];

  const handleMarginChange = (side: 'top' | 'bottom' | 'left' | 'right', val: number) => {
    onUpdateProject({
      margins: {
        ...project.margins,
        [side]: Math.max(0.5, Math.min(6.0, val)),
      },
    });
  };

  const handleResetSetwanStandard = () => {
    onUpdateProject({
      paperSize: 'F4',
      orientation: 'portrait',
      margins: {
        top: 2.0,
        bottom: 2.0,
        left: 2.5, // 2.5 cm left for binding
        right: 2.0,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">Pengaturan Kertas & Margin Dokumen</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-100px)] overflow-y-auto">
          {/* 1. Paper Size Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Ukuran Kertas (Standar Dokumen)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paperKeys.map((size) => {
                const info = PAPER_DIMENSIONS[size];
                const isSelected = project.paperSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => onUpdateProject({ paperSize: size })}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">{info.name}</span>
                        {size === 'F4' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            Standar Setwan
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {info.description}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Orientation */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Orientasi Halaman
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateProject({ orientation: 'portrait' })}
                className={`p-3 rounded-xl border text-center transition flex items-center justify-center gap-2 ${
                  project.orientation === 'portrait'
                    ? 'bg-sky-50 border-sky-500 font-bold text-sky-700 ring-1 ring-sky-400'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="w-4 h-6 border-2 border-current rounded-xs" />
                <span className="text-xs">Portrait (Tegak)</span>
              </button>

              <button
                onClick={() => onUpdateProject({ orientation: 'landscape' })}
                className={`p-3 rounded-xl border text-center transition flex items-center justify-center gap-2 ${
                  project.orientation === 'landscape'
                    ? 'bg-sky-50 border-sky-500 font-bold text-sky-700 ring-1 ring-sky-400'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="w-6 h-4 border-2 border-current rounded-xs" />
                <span className="text-xs">Landscape (Mendatar)</span>
              </button>
            </div>
          </div>

          {/* 3. Margins (Atas, Bawah, Kiri, Kanan in cm) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Margin Halaman (Satuan: cm)</label>
              <button
                onClick={handleResetSetwanStandard}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Standar Setwan</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Margin Atas (Top): {project.margins.top} cm
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={project.margins.top}
                  onChange={(e) => handleMarginChange('top', parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Margin Bawah (Bottom): {project.margins.bottom} cm
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={project.margins.bottom}
                  onChange={(e) => handleMarginChange('bottom', parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Margin Kiri / Penjilidan (Left): {project.margins.left} cm
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="4.5"
                  step="0.1"
                  value={project.margins.left}
                  onChange={(e) => handleMarginChange('left', parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Margin Kanan (Right): {project.margins.right} cm
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={project.margins.right}
                  onChange={(e) => handleMarginChange('right', parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            Tutup
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-900/20 transition"
          >
            Terapkan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
