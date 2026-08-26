import React, { useRef, useState } from 'react';
import {
  Upload,
  FolderUp,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Search,
  Plus,
  Sparkles,
  Move,
} from 'lucide-react';
import { PhotoMetadata } from '../types';
import { readImageFiles } from '../utils/imageFiles';

interface MediaTrayProps {
  photos: PhotoMetadata[];
  onAddPhotos: (newPhotos: PhotoMetadata[]) => void;
  onRemovePhoto: (id: string) => void;
  onAssignToCell?: (photo: PhotoMetadata) => void;
  onOpenAutoCollage?: () => void;
  onImportError?: (message: string) => void;
}

export const MediaTray: React.FC<MediaTrayProps> = ({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onAssignToCell,
  onOpenAutoCollage,
  onImportError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverTray, setDragOverTray] = useState(false);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const { photos: imported, errors } = await readImageFiles(files);
    if (imported.length > 0) onAddPhotos(imported);
    if (errors.length > 0) onImportError?.(errors.slice(0, 3).join(' '));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTray(true);
  };

  const handleDragLeave = () => {
    setDragOverTray(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTray(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const filteredPhotos = photos.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header & Upload Buttons */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-sky-600" />
          Media & Foto Kegiatan Setwan
        </h3>
        <p className="text-xs text-slate-500">
          Impor foto dari komputer atau drag langsung ke slot kisi kanvas
        </p>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFolderChange}
        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
      />

      {/* Action Buttons for Upload */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-900/20 transition"
        >
          <Upload className="w-4 h-4" />
          <span>Unggah File Foto</span>
        </button>

        <button
          onClick={() => folderInputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition border border-slate-700"
          title="Pilih seluruh folder foto dokumentasi"
        >
          <FolderUp className="w-4 h-4 text-amber-400" />
          <span>Unggah 1 Folder</span>
        </button>
      </div>

      {/* Auto-Collage Feature Highlight Banner */}
      {onOpenAutoCollage && (
        <button
          onClick={onOpenAutoCollage}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white flex items-center justify-between shadow-lg shadow-sky-900/20 border border-sky-400/30 transition group"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black tracking-tight">Studio Auto Kisi Foto</div>
              <div className="text-[10px] text-sky-100 opacity-90">Susun foto otomatis ke kisi resmi</div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
        </button>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
          dragOverTray
            ? 'border-sky-500 bg-sky-50 text-sky-700'
            : 'border-slate-300 hover:border-sky-400 bg-slate-50/60 text-slate-500'
        }`}
      >
        <p className="text-xs font-medium">Tarik & Lepas Foto di sini dari Windows Explorer</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Mendukung JPG, PNG, WEBP resolusi tinggi</p>
      </div>

      {/* Search Filter */}
      {photos.length > 0 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari foto kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          />
        </div>
      )}

      {/* Photo Grid List */}
      <div className="space-y-2 max-h-[calc(100vh-370px)] overflow-y-auto pr-1">
        {filteredPhotos.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <ImageIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Belum ada foto yang diimpor</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
              Klik tombol 'Unggah File Foto' atau 'Unggah 1 Folder' di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify(photo));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-sky-400 hover:shadow-md transition cursor-grab active:cursor-grabbing"
              >
                {/* Thumbnail Container */}
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Drag Indicator Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                    <Move className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Tarik ke Slot</span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePhoto(photo.id);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus foto dari galeri"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-2">
                  <p className="text-[11px] font-semibold text-slate-800 truncate" title={photo.name}>
                    {photo.name}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{photo.capturedDate || 'Hari ini'}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
