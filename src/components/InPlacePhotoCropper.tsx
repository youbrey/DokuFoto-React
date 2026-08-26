import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, RotateCcw, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import { CropRect } from '../types';

interface InPlacePhotoCropperProps {
  photoUrl: string;
  initialCropRect?: CropRect;
  rotation?: number;
  onApply: (cropRect: CropRect) => void;
  onCancel: () => void;
}

type AspectPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:4';
type DragHandle = 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right';

export const InPlacePhotoCropper: React.FC<InPlacePhotoCropperProps> = ({
  photoUrl,
  initialCropRect,
  rotation = 0,
  onApply,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<CropRect>(() => {
    if (initialCropRect && initialCropRect.width > 0 && initialCropRect.height > 0) {
      return { ...initialCropRect };
    }
    return { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
  });

  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('free');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Active Drag State
  const [isDragging, setIsDragging] = useState<DragHandle | null>(null);
  const dragStartRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    initialCrop: CropRect;
  } | null>(null);

  // Handle Aspect Ratio Presets
  const applyPreset = (preset: AspectPreset) => {
    setAspectPreset(preset);
    let newW = 0.8;
    let newH = 0.8;

    if (preset === '1:1') {
      newW = 0.7;
      newH = 0.7;
    } else if (preset === '4:3') {
      newW = 0.8;
      newH = 0.6;
    } else if (preset === '16:9') {
      newW = 0.9;
      newH = 0.506;
    } else if (preset === '3:4') {
      newW = 0.6;
      newH = 0.8;
    } else {
      newW = 0.9;
      newH = 0.9;
    }

    const newX = Math.max(0, (1 - newW) / 2);
    const newY = Math.max(0, (1 - newH) / 2);
    setCrop({ x: newX, y: newY, width: newW, height: newH });
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setAspectPreset('free');
    setZoomLevel(1);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onApply(crop);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [crop, onApply, onCancel]);

  // Handle Mouse Drag for Crop Window & 8 Handles
  const startDrag = (handle: DragHandle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handle);
    dragStartRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
    };
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerW = rect.width || 1;
      const containerH = rect.height || 1;

      const dxRel = (e.clientX - dragStartRef.current.startX) / containerW;
      const dyRel = (e.clientY - dragStartRef.current.startY) / containerH;
      const init = dragStartRef.current.initialCrop;

      let nextX = init.x;
      let nextY = init.y;
      let nextW = init.width;
      let nextH = init.height;

      const minSize = 0.1; // 10% minimum crop size

      switch (isDragging) {
        case 'move':
          nextX = Math.max(0, Math.min(1 - init.width, init.x + dxRel));
          nextY = Math.max(0, Math.min(1 - init.height, init.y + dyRel));
          break;

        case 'tl': {
          const right = init.x + init.width;
          const bottom = init.y + init.height;
          nextX = Math.max(0, Math.min(right - minSize, init.x + dxRel));
          nextY = Math.max(0, Math.min(bottom - minSize, init.y + dyRel));
          nextW = right - nextX;
          nextH = bottom - nextY;
          break;
        }

        case 'tr': {
          const left = init.x;
          const bottom = init.y + init.height;
          nextY = Math.max(0, Math.min(bottom - minSize, init.y + dyRel));
          nextW = Math.max(minSize, Math.min(1 - left, init.width + dxRel));
          nextH = bottom - nextY;
          break;
        }

        case 'bl': {
          const right = init.x + init.width;
          const top = init.y;
          nextX = Math.max(0, Math.min(right - minSize, init.x + dxRel));
          nextW = right - nextX;
          nextH = Math.max(minSize, Math.min(1 - top, init.height + dyRel));
          break;
        }

        case 'br': {
          const left = init.x;
          const top = init.y;
          nextW = Math.max(minSize, Math.min(1 - left, init.width + dxRel));
          nextH = Math.max(minSize, Math.min(1 - top, init.height + dyRel));
          break;
        }

        case 'top': {
          const bottom = init.y + init.height;
          nextY = Math.max(0, Math.min(bottom - minSize, init.y + dyRel));
          nextH = bottom - nextY;
          break;
        }

        case 'bottom': {
          const top = init.y;
          nextH = Math.max(minSize, Math.min(1 - top, init.height + dyRel));
          break;
        }

        case 'left': {
          const right = init.x + init.width;
          nextX = Math.max(0, Math.min(right - minSize, init.x + dxRel));
          nextW = right - nextX;
          break;
        }

        case 'right': {
          const left = init.x;
          nextW = Math.max(minSize, Math.min(1 - left, init.width + dxRel));
          break;
        }
      }

      setCrop({
        x: Math.max(0, Math.min(1 - minSize, nextX)),
        y: Math.max(0, Math.min(1 - minSize, nextY)),
        width: Math.max(minSize, Math.min(1, nextW)),
        height: Math.max(minSize, Math.min(1, nextH)),
      });
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(null);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging, onMouseMove, onMouseUp]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 select-none overflow-visible flex items-center justify-center bg-black/80 rounded-md"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating HUD Controls directly attached on top of cell */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 backdrop-blur-md border border-amber-500/50 shadow-2xl rounded-xl px-2 py-1.5 flex items-center gap-1.5 text-xs text-white animate-in fade-in zoom-in-95 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
          <Maximize2 className="w-3 h-3" />
          <span>Crop Langsung</span>
        </span>

        {/* Aspect Ratio Presets */}
        <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          {(['free', '1:1', '4:3', '16:9', '3:4'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                aspectPreset === preset
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {preset === 'free' ? 'Bebas' : preset}
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px]"
          title="Reset Ukuran Penuh (100%)"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-1 text-[11px]"
          title="Batal (Esc)"
        >
          <X className="w-3.5 h-3.5 text-rose-400" />
          <span>Batal</span>
        </button>

        {/* Apply Button */}
        <button
          type="button"
          onClick={() => onApply(crop)}
          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950 text-[11px]"
          title="Terapkan Crop (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Selesai</span>
        </button>
      </div>

      {/* Dimmed Base Background Image */}
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
        <img
          src={photoUrl}
          alt=""
          className="w-full h-full object-cover select-none pointer-events-none opacity-40 filter brightness-50 transition-transform"
          style={{
            transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
          }}
        />

        {/* Highlighted Crop Area Window */}
        <div
          className="absolute border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move group/cropwin"
          style={{
            left: `${crop.x * 100}%`,
            top: `${crop.y * 100}%`,
            width: `${crop.width * 100}%`,
            height: `${crop.height * 100}%`,
          }}
          onMouseDown={(e) => startDrag('move', e)}
        >
          {/* Inner Clear Live Photo View */}
          <div className="w-full h-full relative overflow-hidden pointer-events-none">
            <img
              src={photoUrl}
              alt=""
              className="absolute select-none pointer-events-none"
              style={{
                width: `${(1 / crop.width) * 100}%`,
                height: `${(1 / crop.height) * 100}%`,
                left: `${(-crop.x / crop.width) * 100}%`,
                top: `${(-crop.y / crop.height) * 100}%`,
                objectFit: 'cover',
                transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
              }}
            />
          </div>

          {/* 3x3 Rule-of-Thirds Grid Overlay */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-amber-400/40" />
            <div className="border-r border-b border-amber-400/40" />
            <div className="border-b border-amber-400/40" />
            <div className="border-r border-b border-amber-400/40" />
            <div className="border-r border-b border-amber-400/40" />
            <div className="border-b border-amber-400/40" />
            <div className="border-r border-amber-400/40" />
            <div className="border-r border-amber-400/40" />
            <div />
          </div>

          {/* Center Move Hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cropwin:opacity-80 transition-opacity pointer-events-none">
            <div className="bg-black/60 text-amber-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold shadow">
              <Move className="w-3 h-3" />
              <span>Geser Area</span>
            </div>
          </div>

          {/* 4 Corner Handles */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-30"
            onMouseDown={(e) => startDrag('tl', e)}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-30"
            onMouseDown={(e) => startDrag('tr', e)}
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-30"
            onMouseDown={(e) => startDrag('bl', e)}
          />
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-30"
            onMouseDown={(e) => startDrag('br', e)}
          />

          {/* 4 Edge Handles */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400 border border-white rounded-full cursor-ns-resize shadow-sm hover:scale-110 transition-transform z-20"
            onMouseDown={(e) => startDrag('top', e)}
          />
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-amber-400 border border-white rounded-full cursor-ns-resize shadow-sm hover:scale-110 transition-transform z-20"
            onMouseDown={(e) => startDrag('bottom', e)}
          />
          <div
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-6 bg-amber-400 border border-white rounded-full cursor-ew-resize shadow-sm hover:scale-110 transition-transform z-20"
            onMouseDown={(e) => startDrag('left', e)}
          />
          <div
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-6 bg-amber-400 border border-white rounded-full cursor-ew-resize shadow-sm hover:scale-110 transition-transform z-20"
            onMouseDown={(e) => startDrag('right', e)}
          />
        </div>
      </div>
    </div>
  );
};
