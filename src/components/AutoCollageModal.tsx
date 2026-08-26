import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FolderUp,
  Image as ImageIcon,
  Check,
  X,
  Sliders,
  Maximize2,
  Minimize2,
  Layers,
  LayoutGrid,
  Palette,
  RotateCw,
  Plus,
  Trash2,
  ArrowRight,
  RefreshCw,
  Info,
  FileText,
} from 'lucide-react';
import { PhotoMetadata, CollageGridElement, CollageCell, CollageLayoutTemplate, DocumentProject } from '../types';
import { COLLAGE_LAYOUTS, COLOR_PALETTES, PAPER_DIMENSIONS } from '../utils/constants';

interface AutoCollageModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePhotos: PhotoMetadata[];
  onAddPhotosToGallery: (newPhotos: PhotoMetadata[]) => void;
  onApplyCollage: (
    grid: CollageGridElement,
    createNewPage: boolean,
    titleText?: string
  ) => void;
  activePageNumber: number;
  project: DocumentProject;
}

export const AutoCollageModal: React.FC<AutoCollageModalProps> = ({
  isOpen,
  onClose,
  availablePhotos,
  onAddPhotosToGallery,
  onApplyCollage,
  activePageNumber,
  project,
}) => {
  // Paper dimensions and orientation from active project
  const paperInfo = PAPER_DIMENSIONS[project?.paperSize || 'F4'] || PAPER_DIMENSIONS.F4;
  const isLandscape = project?.orientation === 'landscape';
  const widthMm = isLandscape ? paperInfo.heightMm : paperInfo.widthMm;
  const heightMm = isLandscape ? paperInfo.widthMm : paperInfo.heightMm;
  const paperAspectRatio = widthMm / heightMm; // e.g. 215/330 for F4 portrait, 330/215 for F4 landscape

  // Selected photos for auto-grid
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(() =>
    availablePhotos.slice(0, 6).map((p) => p.id)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Layout selection
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('grid-6-1-2-2-1');

  // Customization options (matching video controls)
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9' | '1:1' | '3:4'>('4:3');
  const [gapMm, setGapMm] = useState<number>(4);
  const [borderRadius, setBorderRadius] = useState<number>(4);
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [borderColor, setBorderColor] = useState<string>('#94a3b8');
  const [gridWidthPercent, setGridWidthPercent] = useState<number>(92);
  const [gridHeightPercent, setGridHeightPercent] = useState<number>(95);

  // Extra options
  const [includeTitle, setIncludeTitle] = useState<boolean>(true);
  const [titleText, setTitleText] = useState<string>('DOKUMENTASI FOTO KEGIATAN');
  const [targetDestination, setTargetDestination] = useState<'current' | 'new'>('current');

  const selectedPhotos = useMemo(() => {
    return selectedPhotoIds
      .map((id) => availablePhotos.find((p) => p.id === id))
      .filter((p): p is PhotoMetadata => !!p);
  }, [selectedPhotoIds, availablePhotos]);

  // Find candidate templates matching count or related templates
  const candidateTemplates = useMemo(() => {
    const count = selectedPhotos.length;
    if (count === 0) return COLLAGE_LAYOUTS;

    // Filter templates that match the count or are close
    const exact = COLLAGE_LAYOUTS.filter((t) => t.cells.length === count);
    if (exact.length > 0) return exact;

    // If no exact match, return all templates sorted by closest cell count
    return [...COLLAGE_LAYOUTS].sort(
      (a, b) => Math.abs(a.cells.length - count) - Math.abs(b.cells.length - count)
    );
  }, [selectedPhotos.length]);

  const activeTemplate =
    COLLAGE_LAYOUTS.find((t) => t.id === selectedLayoutId) || candidateTemplates[0] || COLLAGE_LAYOUTS[0];

  // Process uploaded files
  const processUploadedFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: PhotoMetadata[] = [];
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    let loadedCount = 0;
    const totalFiles = Array.from(files).filter(
      (f) => validImageTypes.includes(f.type) || f.name.match(/\.(jpg|jpeg|png|webp)$/i)
    ).length;

    if (totalFiles === 0) return;

    Array.from(files).forEach((file) => {
      if (validImageTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            const photo: PhotoMetadata = {
              id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
              name: file.name,
              dataUrl: result,
              sizeBytes: file.size,
              capturedDate: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              category: 'Dokumentasi Foto Baru',
            };
            newPhotos.push(photo);
            loadedCount++;

            if (loadedCount === totalFiles) {
              onAddPhotosToGallery(newPhotos);
              // Auto-select the newly uploaded photos
              const newIds = newPhotos.map((p) => p.id);
              setSelectedPhotoIds((prev) => [...newIds, ...prev]);

              // Pick best matching template for total count
              const bestMatch = COLLAGE_LAYOUTS.find((t) => t.cells.length === newPhotos.length);
              if (bestMatch) {
                setSelectedLayoutId(bestMatch.id);
              }
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleTogglePhotoSelect = (id: string) => {
    setSelectedPhotoIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      } else {
        const next = [...prev, id];
        // Auto-switch template if exact count match exists
        const match = COLLAGE_LAYOUTS.find((t) => t.cells.length === next.length);
        if (match) setSelectedLayoutId(match.id);
        return next;
      }
    });
  };

  const handleSelectAllPhotos = () => {
    setSelectedPhotoIds(availablePhotos.map((p) => p.id));
  };

  const handleClearSelectedPhotos = () => {
    setSelectedPhotoIds([]);
  };

  // Generate and Apply Grid with Exact Real-Paper Responsive Proportions
  const handleApply = () => {
    // Base Canvas reference width is 560px
    const baseCanvasWidth = 560;
    const baseCanvasHeight = Math.round(560 / paperAspectRatio);

    const marginTopPx = (project?.margins?.top || 2.5) * 3.78;
    const marginBottomPx = (project?.margins?.bottom || 2.5) * 3.78;
    const marginLeftPx = (project?.margins?.left || 2.5) * 3.78;
    const marginRightPx = (project?.margins?.right || 2.5) * 3.78;

    const hasKopSurat =
      project?.kopSurat?.enabled &&
      (targetDestination === 'new' ? false : activePageNumber === 1);
    const kopSuratHeightPx = hasKopSurat ? 75 : 0;
    const titleHeightPx = includeTitle ? 38 : 0;

    // Available printable height in canvas coordinates
    const availableHeightPx = Math.max(
      160,
      baseCanvasHeight - marginTopPx - marginBottomPx - kopSuratHeightPx - titleHeightPx - 16
    );

    // Calculated height based on template rows and available height
    const calculatedGridHeight = Math.min(
      availableHeightPx,
      Math.max(160, Math.round(availableHeightPx * (gridHeightPercent / 100)))
    );

    // Calculate vertical center Y percentage
    const topStartPx = marginTopPx + kopSuratHeightPx + titleHeightPx + 8;
    const centerYPx = topStartPx + calculatedGridHeight / 2 + Math.max(0, (availableHeightPx - calculatedGridHeight) / 2);
    const calculatedYPercent = Math.min(85, Math.max(15, Math.round((centerYPx / baseCanvasHeight) * 100)));

    const cells: CollageCell[] = activeTemplate.cells.map((tc, index) => {
      const assignedPhoto = selectedPhotos[index] || null;
      return {
        id: `cell-auto-${Date.now()}-${index}`,
        row: tc.row,
        col: tc.col,
        rowSpan: tc.rowSpan || 1,
        colSpan: tc.colSpan || 1,
        aspectRatio: aspectRatio,
        objectFit: 'cover',
        photo: assignedPhoto,
        caption: '',
        showCaption: false,
        rotation: 0,
      };
    });

    const newGrid: CollageGridElement = {
      id: `grid-auto-${Date.now()}`,
      x: 50,
      y: calculatedYPercent,
      widthPercent: gridWidthPercent,
      heightPx: calculatedGridHeight,
      cols: activeTemplate.cols,
      rows: activeTemplate.rows,
      gapMm: gapMm,
      borderRadius: borderRadius,
      borderWidth: borderWidth,
      borderColor: borderColor,
      rotation: 0,
      isLocked: false,
      cells: cells,
    };

    onApplyCollage(newGrid, targetDestination === 'new', includeTitle ? titleText : undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[92vh] max-h-[850px] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-950/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-white">
                  Studio Auto Kisi Kolase Foto
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                  {selectedPhotos.length} Foto Terpilih
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Kertas: {paperInfo.name} ({widthMm}×{heightMm}mm) • {isLandscape ? 'Landscape' : 'Portrait'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Otomatis memasukkan foto ke dalam template kisi resmi sesuai ukuran kertas dokumen Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Controls & Right Live Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Photo Selector & Upload */}
          <div className="w-full md:w-80 border-r border-slate-800 bg-slate-925 flex flex-col overflow-hidden flex-shrink-0">
            {/* Upload Buttons */}
            <div className="p-4 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-300">Pilih / Unggah Foto</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSelectAllPhotos}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    Semua
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={handleClearSelectedPhotos}
                    className="text-[11px] text-slate-400 hover:text-slate-300"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => processUploadedFiles(e.target.files)}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => processUploadedFiles(e.target.files)}
                {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah File</span>
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <FolderUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>1 Folder</span>
                </button>
              </div>
            </div>

            {/* Photo List Gallery */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {availablePhotos.map((photo) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  const orderIndex = selectedPhotoIds.indexOf(photo.id);

                  return (
                    <div
                      key={photo.id}
                      onClick={() => handleTogglePhotoSelect(photo.id)}
                      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-500/50 shadow-md'
                          : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Check badge */}
                      <div
                        className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${
                          isSelected
                            ? 'bg-sky-500 text-white'
                            : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isSelected ? orderIndex + 1 : <Plus className="w-3 h-3" />}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <p className="text-[9px] text-slate-200 truncate font-medium">
                          {photo.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle: Interactive Canvas Live Preview */}
          <div className="flex-1 flex flex-col bg-slate-950 p-4 overflow-hidden justify-between">
            {/* Live Canvas Stage */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-auto p-2">
              {/* Paper Background Preview with Accurate Paper Size & Margins */}
              <div
                className="bg-white text-slate-900 shadow-2xl rounded-lg flex flex-col transition-all duration-300 relative mx-auto"
                style={{
                  aspectRatio: `${paperAspectRatio}`,
                  width: isLandscape ? '94%' : 'auto',
                  maxWidth: isLandscape ? '560px' : '380px',
                  height: isLandscape ? 'auto' : '96%',
                  maxHeight: isLandscape ? '380px' : '490px',
                  paddingTop: `${project?.margins ? Math.max(6, Math.min(24, project.margins.top * 6)) : 14}px`,
                  paddingBottom: `${project?.margins ? Math.max(6, Math.min(24, project.margins.bottom * 6)) : 14}px`,
                  paddingLeft: `${project?.margins ? Math.max(6, Math.min(24, project.margins.left * 6)) : 14}px`,
                  paddingRight: `${project?.margins ? Math.max(6, Math.min(24, project.margins.right * 6)) : 14}px`,
                }}
              >
                {/* Optional Kop Surat Header Preview (if enabled in project) */}
                {project?.kopSurat?.enabled && (
                  <div className="text-center pb-1.5 mb-1.5 border-b border-slate-900 select-none pointer-events-none flex-shrink-0">
                    <h4 className="text-[8px] font-bold uppercase tracking-tight text-slate-800 leading-tight">
                      {project.kopSurat.governmentName || 'PEMERINTAH KOTA BITUNG'}
                    </h4>
                    <h3 className="text-[10px] font-black uppercase tracking-tight text-slate-900 leading-tight">
                      {project.kopSurat.agencyName || 'DEWAN PERWAKILAN RAKYAT DAERAH'}
                    </h3>
                    {project.kopSurat.subAgencyName && (
                      <p className="text-[7.5px] font-bold text-slate-700 leading-tight">
                        {project.kopSurat.subAgencyName}
                      </p>
                    )}
                  </div>
                )}

                {/* Optional Title */}
                {includeTitle && (
                  <div className="text-center mb-2 flex-shrink-0">
                    <h3 className="text-xs font-black tracking-tight text-slate-900 uppercase">
                      {titleText || 'DOKUMENTASI FOTO KEGIATAN'}
                    </h3>
                    <div className="w-12 h-0.5 bg-slate-800 mx-auto mt-0.5" />
                  </div>
                )}

                {/* Auto Grid Layout Box (Guaranteed strictly non-overflowing & proportionally fitted) */}
                <div
                  className="w-full grid flex-1 min-h-0 overflow-hidden my-auto"
                  style={{
                    gridTemplateColumns: `repeat(${activeTemplate.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${activeTemplate.rows}, minmax(0, 1fr))`,
                    gap: `${gapMm}px`,
                    width: `${gridWidthPercent}%`,
                    height: `${gridHeightPercent}%`,
                    margin: 'auto',
                  }}
                >
                  {activeTemplate.cells.map((cell, idx) => {
                    const photo = selectedPhotos[idx];

                    return (
                      <div
                        key={idx}
                        className="relative overflow-hidden bg-slate-100 flex items-center justify-center border transition-all w-full h-full min-h-0"
                        style={{
                          borderRadius: `${borderRadius}px`,
                          borderWidth: `${borderWidth}px`,
                          borderColor: borderColor,
                          borderStyle: borderWidth > 0 ? 'solid' : 'none',
                          gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined,
                          gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined,
                        }}
                      >
                        {photo ? (
                          <img
                            src={photo.dataUrl}
                            alt=""
                            className="w-full h-full object-cover select-none pointer-events-none"
                          />
                        ) : (
                          <div className="p-1 text-center text-slate-400 flex flex-col items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-slate-300 mb-0.5" />
                            <span className="text-[8px] font-bold">Slot Foto {idx + 1}</span>
                          </div>
                        )}

                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                          #{idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom: Template Variations Carousel (matching video at 00:49 - 01:45) */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                  <span>Pilihan Model Kisi ({candidateTemplates.length} Variasi)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {activeTemplate.name}
                </span>
              </div>

              {/* Horizontal Scrollable Thumbnails Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {candidateTemplates.map((template) => {
                  const isSelected = template.id === activeTemplate.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedLayoutId(template.id)}
                      className={`flex-shrink-0 w-32 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-950 border-sky-500 shadow-md ring-2 ring-sky-500/30'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      {/* Mini Thumbnail */}
                      <div
                        className="w-full h-12 bg-slate-950 rounded-lg p-1 border border-slate-800 grid gap-0.5 mb-1.5 shadow-inner"
                        style={{
                          gridTemplateRows: `repeat(${template.rows}, minmax(0, 1fr))`,
                          gridTemplateColumns: `repeat(${template.cols}, minmax(0, 1fr))`,
                        }}
                      >
                        {template.cells.map((c, i) => (
                          <div
                            key={i}
                            className={`rounded-xs ${
                              isSelected ? 'bg-sky-500' : 'bg-slate-700'
                            }`}
                            style={{
                              gridRow: c.rowSpan ? `span ${c.rowSpan}` : undefined,
                              gridColumn: c.colSpan ? `span ${c.colSpan}` : undefined,
                            }}
                          />
                        ))}
                      </div>

                      <div className="text-[10px] font-bold text-slate-200 truncate">
                        {template.name}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {template.cells.length} Foto
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Customization Controls (matching video at 01:09 - 01:44) */}
          <div className="w-full md:w-80 border-l border-slate-800 bg-slate-925 p-4 space-y-4 overflow-y-auto flex-shrink-0">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Pengaturan Format Kisi</span>
              </h3>
            </div>

            {/* 1. Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Proporsi / Aspek Rasio Foto
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['4:3', '16:9', '1:1', '3:4'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition ${
                      aspectRatio === ratio
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Space / Jarak Antar Foto (Gap) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Jarak Antar Foto (Gap):</span>
                <span className="font-bold text-sky-400">{gapMm} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={gapMm}
                onChange={(e) => setGapMm(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 mm (Rapat)</span>
                <span>4 mm (Standar)</span>
                <span>16 mm</span>
              </div>
            </div>

            {/* 2.5. Ukuran & Skala Kisi Kolase */}
            <div className="space-y-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-semibold">Lebar Kisi:</span>
                <span className="font-bold text-sky-400">{gridWidthPercent}% Kertas</span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                step="1"
                value={gridWidthPercent}
                onChange={(e) => setGridWidthPercent(Number(e.target.value))}
                className="w-full accent-sky-500"
              />

              <div className="flex justify-between text-xs text-slate-300 pt-1">
                <span className="font-semibold">Skala Tinggi:</span>
                <span className="font-bold text-sky-400">{gridHeightPercent}% Area Cetak</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                step="1"
                value={gridHeightPercent}
                onChange={(e) => setGridHeightPercent(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="text-[10px] text-slate-400 flex justify-between items-center pt-0.5">
                <span>Pas Batas Margin Kertas Real</span>
                <span className="text-emerald-400 font-bold">Otomatis Terkunci</span>
              </div>
            </div>

            {/* 3. Corner Radius / Sudut Membulat */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Sudut Membulat (Radius):</span>
                <span className="font-bold text-sky-400">{borderRadius} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="2"
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Siku-siku (0)</span>
                <span>Membulat</span>
                <span>Pill (24)</span>
              </div>
            </div>

            {/* 4. Warna & Ketebalan Bingkai */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Garis Bingkai:</span>
                <span className="font-bold text-sky-400">{borderWidth} px</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((bw) => (
                  <button
                    key={bw}
                    type="button"
                    onClick={() => setBorderWidth(bw)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                      borderWidth === bw
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {bw === 0 ? 'Off' : `${bw}px`}
                  </button>
                ))}
              </div>

              {borderWidth > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COLOR_PALETTES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBorderColor(c)}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        borderColor === c ? 'scale-125 ring-2 ring-sky-400' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c, borderColor: '#475569' }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 5. Judul Dokumentasi Opsional */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTitle}
                  onChange={(e) => setIncludeTitle(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-200">
                  Pasang Teks Judul di Atas Kisi
                </span>
              </label>

              {includeTitle && (
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  placeholder="DOKUMENTASI FOTO KEGIATAN..."
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                />
              )}
            </div>

            {/* 6. Target Penempatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Target Penempatan di Dokumen:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetDestination('current')}
                  className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                    targetDestination === 'current'
                      ? 'bg-sky-950 border-sky-500 text-sky-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  Halaman Aktif ({activePageNumber})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetDestination('new')}
                  className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                    targetDestination === 'new'
                      ? 'bg-sky-950 border-sky-500 text-sky-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  + Halaman Baru
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-400" />
            <span>Kisi kolase dapat digeser, diputar, dan diubah ukurannya di kanvas.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-950/50 flex items-center gap-2 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Terapkan Kolase ke Dokumen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
