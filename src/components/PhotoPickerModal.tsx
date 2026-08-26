import React, { useRef } from 'react';
import { X, Image as ImageIcon, Upload, Plus } from 'lucide-react';
import { PhotoMetadata } from '../types';
import { readImageFile } from '../utils/imageFiles';

interface PhotoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoMetadata[];
  onSelectPhoto: (photo: PhotoMetadata) => void;
  onUploadAndSelect: (photo: PhotoMetadata) => void;
  onImportError?: (message: string) => void;
}

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
  isOpen,
  onClose,
  photos,
  onSelectPhoto,
  onUploadAndSelect,
  onImportError,
}) => {
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onUploadAndSelect(await readImageFile(file, 'Unggahan Langsung'));
      onClose();
    } catch (error) {
      onImportError?.(error instanceof Error ? error.message : 'Foto gagal dibaca.');
    } finally {
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">Pilih Foto untuk Slot Kolase</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Pilih dari foto yang telah diimpor atau unggah foto baru langsung dari disk
          </p>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Foto Baru</span>
          </button>
        </div>

        {/* Photo Grid */}
        <div className="p-6 flex-1 overflow-y-auto">
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Belum ada foto dalam galeri</p>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="mt-3 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                Pilih File Foto Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    onSelectPhoto(photo);
                    onClose();
                  }}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 aspect-square hover:border-sky-500 hover:shadow-md transition text-left"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent">
                    <p className="text-[10px] text-white font-semibold truncate">
                      {photo.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
