import React, { useState } from 'react';
import {
  Crop,
  X,
  Check,
  RotateCw,
  RefreshCw,
  Maximize2,
  ZoomIn,
  Move,
  Layers,
} from 'lucide-react';
import { CropRect, PhotoMetadata } from '../types';

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: PhotoMetadata | null;
  initialCropRect?: CropRect;
  onApplyCrop: (cropRect: CropRect) => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  onClose,
  photo,
  initialCropRect,
  onApplyCrop,
}) => {
  const [crop, setCrop] = useState<CropRect>(
    initialCropRect || { x: 0, y: 0, width: 1, height: 1 }
  );
  const [aspectPreset, setAspectPreset] = useState<'free' | '1:1' | '4:3' | '16:9' | '3:4'>('free');
  const [zoom, setZoom] = useState<number>(1);

  const handlePreset = (preset: 'free' | '1:1' | '4:3' | '16:9' | '3:4') => {
    setAspectPreset(preset);
    if (preset === '1:1') {
      setCrop({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 });
    } else if (preset === '4:3') {
      setCrop({ x: 0.1, y: 0.15, width: 0.8, height: 0.6 });
    } else if (preset === '16:9') {
      setCrop({ x: 0.05, y: 0.22, width: 0.9, height: 0.5 });
    } else if (preset === '3:4') {
      setCrop({ x: 0.2, y: 0.05, width: 0.6, height: 0.8 });
    } else {
      setCrop({ x: 0, y: 0, width: 1, height: 1 });
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setAspectPreset('free');
    setZoom(1);
  };

  const handleSave = () => {
    onApplyCrop(crop);
    onClose();
  };

  if (!isOpen || !photo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
              <Crop className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Potong / Crop Foto</h3>
              <p className="text-xs text-slate-400">
                Sesuaikan bingkai dan area fokus foto tanpa mengubah berkas asli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body & Crop Preview Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/60 relative select-none">
          <div className="relative max-w-md max-h-80 w-full aspect-video bg-black/50 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Base Image */}
            <img
              src={photo.dataUrl}
              alt=""
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={{ transform: `scale(${zoom})` }}
            />

            {/* Crop Overlay Grid */}
            <div
              className="absolute border-2 border-dashed border-purple-400 bg-purple-500/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none transition-all"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
            >
              {/* Rule of Thirds Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="w-full mt-5 space-y-4">
            {/* Presets */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400">Rasio Aspek:</span>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['free', '1:1', '4:3', '16:9', '3:4'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      aspectPreset === preset
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {preset === 'free' ? 'Bebas' : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Posisi Horizontal (X)</span>
                  <span>{Math.round(crop.x * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, 1 - crop.width)}
                  step="0.01"
                  value={crop.x}
                  onChange={(e) => setCrop({ ...crop, x: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Posisi Vertikal (Y)</span>
                  <span>{Math.round(crop.y * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, 1 - crop.height)}
                  step="0.01"
                  value={crop.y}
                  onChange={(e) => setCrop({ ...crop, y: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Lebar Area Crop</span>
                  <span>{Math.round(crop.width * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max={1 - crop.x}
                  step="0.01"
                  value={crop.width}
                  onChange={(e) => setCrop({ ...crop, width: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Tinggi Area Crop</span>
                  <span>{Math.round(crop.height * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max={1 - crop.y}
                  step="0.01"
                  value={crop.height}
                  onChange={(e) => setCrop({ ...crop, height: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Potongan</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-950/50 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Potongan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
