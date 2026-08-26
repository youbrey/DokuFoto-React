import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  RotateCcw,
  RotateCw,
  Sparkles,
  Maximize2,
  Compass,
} from 'lucide-react';
import { CropRect } from '../types';

interface CanvaPhotoCropperProps {
  photoUrl: string;
  initialCropRect?: CropRect;
  initialRotation?: number;
  onApply: (cropRect: CropRect, rotation: number) => void;
  onCancel: () => void;
}

type AspectPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:4';
type DragHandle = 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'rotate';

export const CanvaPhotoCropper: React.FC<CanvaPhotoCropperProps> = ({
  photoUrl,
  initialCropRect,
  initialRotation = 0,
  onApply,
  onCancel,
}) => {
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const leftSidebarRef = useRef<HTMLDivElement>(null);

  // Normalize initial crop values
  const validInitialCrop: CropRect =
    initialCropRect &&
    initialCropRect.width > 0 &&
    initialCropRect.height > 0
      ? { ...initialCropRect }
      : { x: 0, y: 0, width: 1, height: 1 };

  const [crop, setCrop] = useState<CropRect>(validInitialCrop);
  const [rotation, setRotation] = useState<number>(initialRotation || 0);
  const [activeTab, setActiveTab] = useState<'crop' | 'smart'>('crop');

  // Keep latest state in refs for outside-click commit
  const latestCropRef = useRef(crop);
  latestCropRef.current = crop;
  const latestRotationRef = useRef(rotation);
  latestRotationRef.current = rotation;

  // Dragging interaction state
  const [isDragging, setIsDragging] = useState<DragHandle | null>(null);
  const dragStartRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    initialCrop: CropRect;
    initialRot: number;
    frameW: number;
    frameH: number;
    photoCenterX: number;
    photoCenterY: number;
    distStart: number;
  } | null>(null);

  // Smart Crop / Golden Ratio Focus
  const handleSmartCrop = () => {
    setActiveTab('smart');
    setCrop({
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
    });
  };

  // Auto Straighten (Snap to 0°, 90°, 180°, 270°)
  const handleAutoStraighten = () => {
    const normalized = ((rotation % 360) + 360) % 360;
    const snapAngles = [0, 90, 180, 270, 360];
    let closest = 0;
    let minDiff = 360;
    for (const angle of snapAngles) {
      const diff = Math.abs(normalized - angle);
      if (diff < minDiff) {
        minDiff = diff;
        closest = angle === 360 ? 0 : angle;
      }
    }
    setRotation(closest);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setRotation(0);
    setActiveTab('crop');
  };

  // Keyboard Shortcuts (Enter = Finish & Apply, Esc = Cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onApply(latestCropRef.current, latestRotationRef.current);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onApply, onCancel]);

  // Click anywhere outside on the document or canvas -> Automatically Finish & Apply Crop!
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (isDragging) return;

      const target = e.target as HTMLElement;
      if (!target) return;

      const insideFrame = frameContainerRef.current && frameContainerRef.current.contains(target);
      const insideSidebar = leftSidebarRef.current && leftSidebarRef.current.contains(target);

      if (!insideFrame && !insideSidebar) {
        // User clicked outside on the canvas/document/background -> Commit crop!
        onApply(latestCropRef.current, latestRotationRef.current);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isDragging, onApply]);

  // Start dragging handles or photo
  const startDrag = (handle: DragHandle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let frameW = 200;
    let frameH = 200;
    let photoCenterX = 0;
    let photoCenterY = 0;

    if (frameContainerRef.current) {
      const r = frameContainerRef.current.getBoundingClientRect();
      frameW = Math.max(10, r.width);
      frameH = Math.max(10, r.height);

      // Current Photo rendered dimensions
      const safeW = Math.max(0.05, crop.width);
      const safeH = Math.max(0.05, crop.height);
      const photoW = frameW / safeW;
      const photoH = frameH / safeH;
      const photoLeft = r.left + (-crop.x / safeW) * frameW;
      const photoTop = r.top + (-crop.y / safeH) * frameH;

      photoCenterX = photoLeft + photoW / 2;
      photoCenterY = photoTop + photoH / 2;
    }

    const distStart = Math.hypot(e.clientX - photoCenterX, e.clientY - photoCenterY) || 1;

    setIsDragging(handle);
    dragStartRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      initialRot: rotation,
      frameW,
      frameH,
      photoCenterX,
      photoCenterY,
      distStart,
    };
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || !frameContainerRef.current) return;

      const {
        handle,
        startX,
        startY,
        initialCrop,
        initialRot,
        frameW,
        frameH,
        photoCenterX,
        photoCenterY,
        distStart,
      } = dragStartRef.current;

      // Handle Direct Rotation via On-Canvas Handle
      if (handle === 'rotate') {
        const initialAngle = Math.atan2(startY - photoCenterY, startX - photoCenterX) * (180 / Math.PI);
        const currentAngle = Math.atan2(e.clientY - photoCenterY, e.clientX - photoCenterX) * (180 / Math.PI);
        const diff = currentAngle - initialAngle;
        let newRot = Math.round((initialRot + diff) * 10) / 10;
        // Snap near 0, 90, 180, 270
        for (const snap of [-180, -90, 0, 90, 180, 270, 360]) {
          if (Math.abs(newRot - snap) < 2) {
            newRot = snap;
            break;
          }
        }
        setRotation(newRot);
        return;
      }

      const dxPx = e.clientX - startX;
      const dyPx = e.clientY - startY;

      const safeInitW = Math.max(0.05, initialCrop.width);
      const safeInitH = Math.max(0.05, initialCrop.height);
      const photoW = frameW / safeInitW;
      const photoH = frameH / safeInitH;

      if (handle === 'move') {
        // Direct 1-to-1 Panning: The photo shifts directly under the mouse
        const dxNorm = dxPx / photoW;
        const dyNorm = dyPx / photoH;

        setCrop({
          ...initialCrop,
          x: initialCrop.x - dxNorm,
          y: initialCrop.y - dyNorm,
        });
        return;
      }

      // Handle Corner Handles Scaling (Zooming In/Out with Aspect-Ratio Lock)
      if (['tl', 'tr', 'bl', 'br'].includes(handle)) {
        const currentDist = Math.hypot(e.clientX - photoCenterX, e.clientY - photoCenterY);
        const scaleRatio = Math.max(0.2, Math.min(6.0, currentDist / distStart));

        // When scaleRatio > 1, photo becomes larger, so crop.width / crop.height decreases
        const newWidth = Math.max(0.05, Math.min(1.2, initialCrop.width / scaleRatio));
        const newHeight = Math.max(0.05, Math.min(1.2, initialCrop.height / scaleRatio));

        // Preserve center of current crop
        const centerCropX = initialCrop.x + initialCrop.width / 2;
        const centerCropY = initialCrop.y + initialCrop.height / 2;

        setCrop({
          width: newWidth,
          height: newHeight,
          x: centerCropX - newWidth / 2,
          y: centerCropY - newHeight / 2,
        });
      }
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

  // Derived dimensions of the photo relative to the frame (in percentages of frame)
  const safeCropW = Math.max(0.05, crop.width || 1);
  const safeCropH = Math.max(0.05, crop.height || 1);

  const photoWidthPercent = (1 / safeCropW) * 100;
  const photoHeightPercent = (1 / safeCropH) * 100;
  const photoLeftPercent = (-crop.x / safeCropW) * 100;
  const photoTopPercent = (-crop.y / safeCropH) * 100;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. CANVA DOCKED LEFT SIDEBAR PANEL (OUTSIDE THE DOCUMENT / CANVAS)        */}
      {/* ========================================================================= */}
      <div
        ref={leftSidebarRef}
        className="fixed top-14 left-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-[9999] flex flex-col justify-between p-5 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-left-6 duration-200 select-none overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          {/* Header: Title "Pangkas" & Close "X" Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Maximize2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight text-slate-900 dark:text-white">
                  Pangkas
                </h3>
                <span className="text-xs text-slate-400">Atur perbesaran & rotasi foto</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onApply(crop, rotation)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Tutup & Terapkan Pangkas"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector: Pangkas / Pangkas Cerdas */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('crop')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'crop'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pangkas
            </button>
            <button
              type="button"
              onClick={handleSmartCrop}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'smart'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600'
              }`}
              title="Pangkas Cerdas: Fokus otomatis komposisi foto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pangkas Cerdas</span>
            </button>
          </div>

          {/* Section: Rotasi (Putar) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Putar</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400">
                  {rotation > 0 ? `+${rotation.toFixed(1)}°` : `${rotation.toFixed(1)}°`}
                </span>
                <button
                  type="button"
                  onClick={handleAutoStraighten}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 transition"
                  title="Ratakan foto secara otomatis"
                >
                  Otomatis
                </button>
              </div>
            </div>

            {/* Slider -180 to +180 */}
            <div className="flex items-center gap-2.5 pt-1">
              <span className="text-[11px] text-slate-400 font-mono">-180°</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={0.1}
                value={rotation}
                onChange={(e) => setRotation(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-[11px] text-slate-400 font-mono">+180°</span>
            </div>

            {/* Quick 90 deg Rotate & Reset */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setRotation((prev) => (prev - 90 < -180 ? prev - 90 + 360 : prev - 90))
                  }
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                  title="Putar 90° ke kiri"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRotation((prev) => (prev + 90 > 180 ? prev + 90 - 360 : prev + 90))
                  }
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                  title="Putar 90° ke kanan"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
              >
                Reset Semula
              </button>
            </div>
          </div>

          {/* Quick Guidance Instructions */}
          <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl space-y-1.5 text-xs text-purple-900 dark:text-purple-300">
            <div className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
              <span>✨ Panduan Pangkas Gaya Canva:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
              <li>
                <strong>Seret foto</strong> langsung untuk menggeser posisi.
              </li>
              <li>
                <strong>Tarik 4 bulatan sudut</strong> untuk memperbesar/memperkecil foto.
              </li>
              <li>
                <strong>Klik di mana saja</strong> pada lembar kerja untuk langsung menyimpan.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Actions: Batalkan & Selesai */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={() => onApply(crop, rotation)}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ON-CANVAS INTERACTIVE CROP (EXACTLY MATCHING CANVA)                    */}
      {/* ========================================================================= */}
      <div
        ref={frameContainerRef}
        className="absolute inset-0 z-50 select-none overflow-visible pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A. FULL OVERFLOWING UNCONSTRAINED GHOST PHOTO */}
        <div
          className="absolute cursor-move overflow-visible"
          style={{
            left: `${photoLeftPercent}%`,
            top: `${photoTopPercent}%`,
            width: `${photoWidthPercent}%`,
            height: `${photoHeightPercent}%`,
            transformOrigin: 'center center',
            transform: `rotate(${rotation}deg)`,
          }}
          onMouseDown={(e) => startDrag('move', e)}
        >
          {/* Semi-transparent ghost photo extending out onto the canvas */}
          <img
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover select-none pointer-events-none opacity-40 filter brightness-90 shadow-2xl"
          />

          {/* Purple Bounding Box around the full photo */}
          <div className="absolute inset-0 border-2 border-purple-500/80 pointer-events-none" />

          {/* 4 Corner Round Handles (Canva Style) */}
          <div
            className="absolute -top-3 -left-3 w-6 h-6 bg-white border-2 border-purple-600 rounded-full cursor-nwse-resize shadow-2xl hover:scale-125 transition-transform z-30 flex items-center justify-center"
            onMouseDown={(e) => startDrag('tl', e)}
            title="Tarik untuk memperbesar / memperkecil foto"
          >
            <div className="w-2 h-2 bg-purple-600 rounded-full" />
          </div>
          <div
            className="absolute -top-3 -right-3 w-6 h-6 bg-white border-2 border-purple-600 rounded-full cursor-nesw-resize shadow-2xl hover:scale-125 transition-transform z-30 flex items-center justify-center"
            onMouseDown={(e) => startDrag('tr', e)}
            title="Tarik untuk memperbesar / memperkecil foto"
          >
            <div className="w-2 h-2 bg-purple-600 rounded-full" />
          </div>
          <div
            className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border-2 border-purple-600 rounded-full cursor-nesw-resize shadow-2xl hover:scale-125 transition-transform z-30 flex items-center justify-center"
            onMouseDown={(e) => startDrag('bl', e)}
            title="Tarik untuk memperbesar / memperkecil foto"
          >
            <div className="w-2 h-2 bg-purple-600 rounded-full" />
          </div>
          <div
            className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-purple-600 rounded-full cursor-nwse-resize shadow-2xl hover:scale-125 transition-transform z-30 flex items-center justify-center"
            onMouseDown={(e) => startDrag('br', e)}
            title="Tarik untuk memperbesar / memperkecil foto"
          >
            <div className="w-2 h-2 bg-purple-600 rounded-full" />
          </div>

          {/* On-Canvas Rotation Handle (Bottom Circle) */}
          <div
            className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-9 h-9 bg-white dark:bg-slate-900 border-2 border-purple-600 text-purple-600 dark:text-purple-400 rounded-full cursor-grab active:cursor-grabbing shadow-2xl hover:scale-110 transition-transform z-40 flex items-center justify-center group/rotbtn"
            onMouseDown={(e) => startDrag('rotate', e)}
            title="Tarik untuk memutar foto secara bebas"
          >
            <RotateCw className="w-4.5 h-4.5 group-hover/rotbtn:rotate-90 transition-transform duration-300" />
          </div>
        </div>

        {/* B. THE FRAME VIEWPORT (100% Crisp Photo Inside Frame, with Rule-of-Thirds Grid) */}
        <div className="absolute inset-0 overflow-hidden border-2 border-purple-600 shadow-2xl pointer-events-none">
          {/* Inner Clear Live Photo View inside the frame */}
          <div className="w-full h-full relative overflow-hidden">
            <img
              src={photoUrl}
              alt=""
              className="absolute select-none pointer-events-none"
              style={{
                width: `${photoWidthPercent}%`,
                height: `${photoHeightPercent}%`,
                left: `${photoLeftPercent}%`,
                top: `${photoTopPercent}%`,
                objectFit: 'cover',
                transformOrigin: 'center center',
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* 3x3 Rule-of-Thirds Grid Overlay */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-white/50 shadow-sm" />
            <div className="border-r border-b border-white/50 shadow-sm" />
            <div className="border-b border-white/50 shadow-sm" />
            <div className="border-r border-b border-white/50 shadow-sm" />
            <div className="border-r border-b border-white/50 shadow-sm" />
            <div className="border-b border-white/50 shadow-sm" />
            <div className="border-r border-b border-white/50 shadow-sm" />
            <div className="border-r border-b border-white/50 shadow-sm" />
            <div />
          </div>
        </div>
      </div>
    </>
  );
};
